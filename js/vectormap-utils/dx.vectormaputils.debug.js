/*! 
* DevExtreme (Vector Map)
* Version: 15.1.5
* Build date: Jul 15, 2015
*
* Copyright (c) 2012 - 2015 Developer Express Inc. ALL RIGHTS RESERVED
* EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
*/
(function (window, undefined) {
"use strict";

function noop() { }

function eigen(x) { return x; }

function isFunction(target) {
    return typeof target === "function";
}

var SHP = ".shp",
    DBF = ".dbf";

function parseCore(source, processCoordinates, processAttributes, errors) {
    var shp = source[SHP] ? parseShp(new Stream(source[SHP])) : {},
        dbf = source[DBF] ? parseDbf(new Stream(source[DBF])) : {},
        features;
    shp.errors && shp.errors.forEach(function (err) {
        errors.push("SHP: " + err);
    });
    dbf.errors && dbf.errors.forEach(function (err) {
        errors.push("DBF: " + err);
    });
    features = buildFeatures(shp.shapes || [], dbf.records || [], processCoordinates, processAttributes);
    return features.length ? {
        features: features,
        bbox: shp.bbox,
        type: shp.type
    } : null;
}

function buildFeatures(shapes, records, processCoordinates, processAttributes) {
    var features = [],
        i,
        ii,
        shape;
    features.length = ii = Math.max(shapes.length, records.length);
    for (i = 0; i < ii; ++i) {
        shape = shapes[i] || {};
        features[i] = {
            coordinates: shape.coordinates ? processCoordinates(shape.coordinates) : null,
            attributes: records[i] ? processAttributes(records[i]) : null
        };
    }
    return features;
}

function getData(source, callback) {
    var count = 1,
        errors = [],
        result = {};
    Object.keys(source).forEach(function (name) {
        var value = source[name];
        if (value !== undefined && value !== null) {
            ++count;
            if (value.substr) {
                sendRequest(value, function (e, response) {
                    e && errors.push(e);
                    onReady(name, response);
                });
            } else {
                onReady(name, value);
            }
        }
    });
    onReady();

    function onReady(name, value) {
        if (name) {
            result[name] = value;
        }
        if (--count === 0) {
            callback(errors, result);
        }
    }
}

function createCoordinatesRounder(precision) {
    var factor = Number("1E" + precision);
    function round(x) {
        return Math.round(x * factor) / factor;
    }
    function process(values) {
        return values.map(values[0].length ? process : round);
    }
    return process;
}

function createAttributesProcessor(data) {
    var info,
        translate;
    try {
        info = JSON.parse(data);
    } catch (_) {
        info = {};
        data.split(";").forEach(function (item) {
            var pair = item.split("=");
            info[pair[0]] = pair[1] || true;
        });
    }
    if (info["$clear"]) {
        translate = function () { return null; };
    } else if (info["$lowercase"]) {
        translate = function (x) { return x.toLowerCase(); };
    } else if (info["$uppercase"]) {
        translate = function (x) { return x.toUpperCase(); };
    } else {
        translate = eigen;
    }
    return process;

    function process(attrs) {
        var result = {};
        Object.keys(attrs).forEach(function (name) {
            var newName = info[name] || translate(name);
            if (newName) {
                result[newName] = attrs[name];
            }
        });
        return result;
    }
}

function getCoordinatesProcessor(parameters) {
    var result;
    if (isFunction(parameters.processCoordinates)) {
        result = parameters.processCoordinates;
    } else if (parameters.precision >= 0) {
        result = createCoordinatesRounder(parameters.precision);
    } else {
        result = eigen;
    }
    return result;
}

function getAttributesProcessor(parameters) {
    var result;
    if (isFunction(parameters.processAttributes)) {
        result = parameters.processAttributes;
    } else if (parameters.attrsMap) {
        result = createAttributesProcessor(parameters.attrsMap);
    } else {
        result = eigen;
    }
    return result;
}

function parse(source, parameters, callback) {
    source = source || {};
    callback = (isFunction(parameters) && parameters) || (isFunction(callback) && callback) || noop,
    parameters = (!isFunction(parameters) && parameters) || {};
    var arg = {},
        result;
    if (source.substr) {
        if (source.substr(-SHP.length).toLowerCase() === SHP) {
            arg[SHP] = source;
        } else if (source.substr(-DBF.length).toLowerCase() === DBF) {
            arg[DBF] = source;
        } else {
            arg[SHP] = source + SHP;
            arg[DBF] = source + DBF;
        }
    } else {
        arg[SHP] = source.shp;
        arg[DBF] = source.dbf;
    }
    getData(arg, function (e, data) {
        var errors = [];
        e && e.forEach(function (err) {
            errors.push("URI: " + err);
        });
        result = parseCore(data, getCoordinatesProcessor(parameters), getAttributesProcessor(parameters), errors);
        callback(result, errors.length ? errors : null);
    });
    return result;
}

function parseShp(stream) {
    var timeStart = new Date(),
        header,
        errors = [],
        records = [],
        record;
    try {
        header = parseShpHeader(stream);
    }
    catch (e) {
        errors.push('Terminated: ' + e.message + ' / ' + e.description);
        return { errors: errors };
    }
    if (header.fileCode !== 9994) {
        errors.push('File code: ' + header.fileCode + ' / expected: 9994');
    }
    if (header.version !== 1000) {
        errors.push('File version: ' + header.version + ' / expected: 1000');
    }
    try {
        while (stream.position() < header.fileLength) {
            record = parseShpRecord(stream, header.shapeType, errors);
            if (record) {
                records.push(record);
            }
            else {
                errors.push('Terminated');
                break;
            }
        }
        if (stream.position() !== header.fileLength) {
            errors.push('File length: ' + header.fileLength + ' / actual: ' + stream.position());
        }
    }
    catch (e) {
        errors.push('Terminated: ' + e.message + ' / ' + e.description);
    }
    finally {
        return {
            bbox: [header.bbox.xmin, header.bbox.ymin, header.bbox.xmax, header.bbox.ymax],
            type: SHP_TYPES[header.shapeType],
            shapes: records,
            errors: errors,
            time: new Date() - timeStart
        };
    }
}

function parseShpHeader(stream) {
    return {
        fileCode: stream.uint32(true),
        unused1: stream.uint32(true),
        unused2: stream.uint32(true),
        unused3: stream.uint32(true),
        unused4: stream.uint32(true),
        unused5: stream.uint32(true),
        fileLength: stream.uint32(true) << 1,
        version: stream.uint32(),
        shapeType: stream.uint32(),
        bbox: {
            xmin: stream.float64(),
            ymin: stream.float64(),
            xmax: stream.float64(),
            ymax: stream.float64(),
            zmin: stream.float64(),
            zmax: stream.float64(),
            mmin: stream.float64(),
            mmax: stream.float64()
        }
    };
}

var SHP_TYPES = {
    0: "null",
    1: "point",
    3: "polyline",
    5: "polygon",
    8: "multipoint"
};

var SHP_RECORD_PARSERS = {
    0: noop,
    1: function (stream, record) {
        record.coordinates = [stream.float64(), stream.float64()];
    },
    3: function (stream, record) {
        var bbox = [stream.float64(), stream.float64(), stream.float64(), stream.float64()],
            numParts = stream.uint32(),
            numPoints = stream.uint32(),
            parts = [],
            points = [],
            i, k, kk,
            rings = [], ring;
        for (i = 0; i < numParts; ++i) {
            parts.push(stream.uint32());
        }
        for (i = 0; i < numPoints; ++i) {
            points.push([stream.float64(), stream.float64()]);
        }
        for (i = 0; i < numParts; ++i) {
            k = parts[i];
            kk = parts[i + 1] || numPoints;
            ring = [];
            for (k = parts[i], kk = parts[i + 1] || numPoints; k < kk; ++k) {
                ring.push(points[k]);
            }
            rings.push(ring);
        }
        record.bbox = bbox;
        record.coordinates = rings;
    },
    8: function (stream, record) {
        var bbox = [stream.float64(), stream.float64(), stream.float64(), stream.float64()],
            numPoints = stream.uint32(),
            points = [],
            i;
        for (i = 0; i < numPoints; ++i) {
            points.push([stream.float64(), stream.float64()]);
        }
        record.bbox = bbox;
        record.coordinates = points;
    }
};
SHP_RECORD_PARSERS[5] = SHP_RECORD_PARSERS[3];

function parseShpRecord(stream, shapeType, errors) {
    var record = {};
    record.number = stream.uint32(true);
    var length = stream.uint32(true) << 1;
    var start = stream.position();
    record.shapeType = stream.uint32();
    record.shapeName = SHP_TYPES[record.shapeType];
    if (!record.shapeName) {
        errors.push('Shape #' + record.number + ' type: ' + record.shapeType + ' / unknown');
        return null;
    }
    if (record.shapeType !== shapeType) {
        errors.push('Shape #' + record.number + ' type: ' + record.shapeName + ' / expected: ' + SHP_TYPES[shapeType]);
    }
    SHP_RECORD_PARSERS[record.shapeType](stream, record);
    var end = stream.position();
    if (end - start !== length) {
        errors.push('Shape #' + record.number + ' length: ' + length + ' / actual: ' + end - start);
    }
    return record;
}

function parseDbf(stream) {
    var timeStart = new Date(), errors = [], header, parseData, records;
    try {
        header = parseDbfHeader(stream, errors);
        parseData = prepareDbfRecordParseData(header, errors);
        records = parseDbfRecords(stream, header.numberOfRecords, header.recordLength, parseData, errors);
    }
    catch (e) {
        errors.push('Terminated: ' + e.message + ' / ' + e.description);
    }
    finally {
        return { records: records, errors: errors, time: new Date() - timeStart };
    }
}

function parseDbfHeader(stream, errors) {
    var header = {
        versionNumber: stream.uint8(),
        lastUpdate: new Date(1900 + stream.uint8(), stream.uint8() - 1, stream.uint8()),
        numberOfRecords: stream.uint32(),
        headerLength: stream.uint16(),
        recordLength: stream.uint16()
    };
    stream.skip(20);
    var numberOfFields = (header.headerLength - stream.position() - 1) / 32;
    var fields = [];
    while (numberOfFields-- > 0) {
        fields.push(parseFieldDescriptor(stream));
    }
    header.fields = fields;
    var term = stream.uint8();
    if (term !== 13) {
        errors.push('Header terminator: ' + term + ' / expected: 13');
    }
    return header;
}

var _fromCharCode = String.fromCharCode;

function getAsciiString(stream, length) {
    return _fromCharCode.apply(null, stream.uint8array(length));
}

function parseFieldDescriptor(stream) {
    var desc = {
        name: getAsciiString(stream, 11).replace(/\0*$/gi, ''),
        type: _fromCharCode(stream.uint8()),
        length: stream.skip(4).uint8(),
        count: stream.uint8()
    };
    stream.skip(14);
    return desc;
}

var DBF_FIELD_PARSERS = {
    "C": function (stream, length) {
        var str = getAsciiString(stream, length);
        return str.trim();
    },
    "N": function (stream, length) {
        var str = getAsciiString(stream, length);
        return parseFloat(str, 10);
    },
    "D": function (stream, length) {
        var str = getAsciiString(stream, length);
        return new Date(str.substring(0, 4), str.substring(4, 6) - 1, str.substring(6, 8));
    }
};

function DBF_FIELD_PARSER_DEFAULT(stream, length) {
    stream.skip(length);
    return null;
}

function prepareDbfRecordParseData(header, errors) {
    var list = [],
        i = 0, ii = header.fields.length,
        item, field,
        totalLength = 0;
    for (; i < ii; ++i) {
        field = header.fields[i];
        item = {
            name: field.name,
            parser: DBF_FIELD_PARSERS[field.type],
            length: field.length
        };
        if (!item.parser) {
            item.parser = DBF_FIELD_PARSER_DEFAULT;
            errors.push('Field ' + field.name + ' type: ' + field.type + ' / unknown');
        }
        totalLength += field.length;
        list.push(item);
    }
    if (totalLength + 1 !== header.recordLength) {
        errors.push('Record length: ' + header.recordLength + ' / actual: ' + (totalLength + 1));
    }
    return list;
}

function parseDbfRecords(stream, recordCount, recordLength, parseData, errors) {
    var i = 0, j, jj = parseData.length,
        start, end,
        records = [], record, pd;
    for (; i < recordCount; ++i) {
        record = {};
        start = stream.position();
        stream.skip(1);
        for (j = 0; j < jj; ++j) {
            pd = parseData[j];
            record[pd.name] = pd.parser(stream, pd.length);
        }
        end = stream.position();
        if (end - start !== recordLength) {
            errors.push('Record #' + (i + 1) + ' length: ' + recordLength + ' / actual: ' + end - start);
        }
        records.push(record);
    }
    return records;
}

function Stream(arrayBuffer) {
    this._dataView = new DataView(arrayBuffer);
    this._position = 0;
}

Stream.prototype = {
    constructor: Stream,

    position: function () {
        return this._position;
    },

    skip: function (count) {
        this._position += count;
        return this;
    },

    uint8array: function (length) {
        var dv = this._dataView, i = 0, list = [];
        for (; i++ < length;) {
            list.push(dv.getUint8(this._position++));
        }
        return list;
    },

    uint8: function () {
        return this._dataView.getUint8(this._position++);
    },

    uint16: function (bigEndian) {
        var result = this._dataView.getUint16(this._position, !bigEndian);
        this._position += 2;
        return result;
    },

    uint32: function (bigEndian) {
        var result = this._dataView.getUint32(this._position, !bigEndian);
        this._position += 4;
        return result;
    },

    float64: function (bigEndian) {
        var result = this._dataView.getFloat64(this._position, !bigEndian);
        this._position += 8;
        return result;
    }
};

function sendRequest(url, callback) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (this.readyState === 4) {
            if (this.statusText === "OK") {
                callback(null, this.response);
            } else {
                callback(this.statusText, null);
            }
        }
    };
    request.open('GET', url);
    request.responseType = 'arraybuffer';
    request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    request.send(null);
}

var DX = window.DevExpress = window.DevExpress || {};
(DX.viz = DX.viz || {}).vectormaputils = { parse: parse };

}(window));