/*! 
* DevExtreme (Vector Map)
* Version: 15.1.6
* Build date: Aug 14, 2015
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

function wrapSource(source) {
    var buffer = wrapBuffer(source),
        position = 0,
        stream;

    stream = {
        pos: function () {
            return position;
        },

        skip: function (count) {
            position += count;
            return stream;
        },

        ui8arr: function (length) {
            var i = 0,
                list = [];
            list.length = length;
            for (; i < length; ++i) {
                list[i] = stream.ui8();
            }
            return list;
        },

        ui8: function () {
            var val = ui8(buffer, position);
            position += 1;
            return val;
        },

        ui16le: function () {
            var val = ui16le(buffer, position);
            position += 2;
            return val;
        },

        ui32le: function () {
            var val = ui32le(buffer, position);
            position += 4;
            return val;
        },

        ui32be: function () {
            var val = ui32be(buffer, position);
            position += 4;
            return val;
        },

        f64le: function () {
            var val = f64le(buffer, position);
            position += 8;
            return val;
        }
    };
    return stream;
}

function parseCore(source, roundCoordinates, errors) {
    var shpData = source[0] ? parseShp(wrapSource(source[0]), errors) : {},
        dbfData = source[1] ? parseDbf(wrapSource(source[1]), errors) : {},
        features = buildFeatures(shpData.shapes || [], dbfData.records || [], roundCoordinates);
    return features.length ? {
        type: "FeatureCollection",
        bbox: shpData.bbox,
        features: features,
    } : null;
}

function buildFeatures(shpData, dbfData, roundCoordinates) {
    var features = [],
        i,
        ii = features.length = ii = Math.max(shpData.length, dbfData.length),
        shape;
    for (i = 0; i < ii; ++i) {
        shape = shpData[i] || {};
        features[i] = {
            type: "Feature",
            geometry: {
                type: shape.type || null,
                coordinates: shape.coordinates ? roundCoordinates(shape.coordinates) : null
            },
            properties: dbfData[i] || null
        };
    }
    return features;
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

function buildParseArgs(source) {
    source = source || {};
    return ["shp", "dbf"].map(function (key) {
        return function (done) {
            if (source.substr) {
                key = "." + key;
                sendRequest(source + (source.substr(-key.length).toLowerCase() === key ? "" : key), function (e, response) {
                    done(e, response);
                });
            } else {
                done(null, source[key] || null);
            }
        };
    });
}

function parse(source, parameters, callback) {
    var result;
    when(buildParseArgs(source), function (errorArray, dataArray) {
        callback = (isFunction(parameters) && parameters) || (isFunction(callback) && callback) || noop;
        parameters = (!isFunction(parameters) && parameters) || {};
        var errors = [];
        errorArray.forEach(function (e) {
            e && errors.push(e);
        });
        result = parseCore(dataArray, parameters.precision >= 0 ? createCoordinatesRounder(parameters.precision) : eigen, errors);
        // NOTE: The order of the error and the result is reversed because of backward compatibility
        callback(result, errors.length ? errors : null);
    });
    return result;
}

function when(actions, callback) {
    var errorArray = [],
        dataArray = [],
        counter = 1,
        lock = true;
    actions.forEach(function (action, i) {
        ++counter;
        action(function (e, data) {
            errorArray[i] = e;
            dataArray[i] = data;
            massDone();
        });
    });
    lock = false;
    massDone();
    function massDone() {
        --counter;
        if(counter === 0 && !lock) {
            callback(errorArray, dataArray);
        }
    }
}

function parseShp(stream, errors) {
    var timeStart,
        timeEnd,
        header,
        records = [],
        record;
    try {
        timeStart = new Date();
        header = parseShpHeader(stream);
    }
    catch (e) {
        errors.push("shp: header parsing error: " + e.message + " / " + e.description);
        return;
    }
    if (header.fileCode !== 9994) {
        errors.push("shp: file code: " + header.fileCode + " / expected: 9994");
    }
    if (header.version !== 1000) {
        errors.push("shp: file version: " + header.version + " / expected: 1000");
    }
    try {
        while (stream.pos() < header.fileLength) {
            record = parseShpRecord(stream, header.shapeType, errors);
            if (record) {
                records.push(record);
            }
            else {
                break;
            }
        }
        if (stream.pos() !== header.fileLength) {
            errors.push("shp: file length: " + header.fileLength + " / actual: " + stream.pos());
        }
        timeEnd = new Date();
    }
    catch (e) {
        errors.push("shp: records parsing error: " + e.message + " / " + e.description);
    }
    finally {
        return {
            bbox: header.bbox_xy,
            type: header.shapeType,
            shapes: records,
            errors: errors,
            time: timeEnd - timeStart
        };
    }
}

function parseShpHeader(stream) {
    var header = {};
    header.fileCode = stream.ui32be();
    stream.skip(20);
    header.fileLength = stream.ui32be() << 1;
    header.version = stream.ui32le();
    header.shapeType = SHP_TYPES[stream.ui32le()];
    header.bbox_xy = readBBox(stream);
    header.bbox_zm = readPoints(stream, 2);
    return header;
}

var SHP_TYPES = {
    0: "Null",
    1: "Point",
    3: "PolyLine",
    5: "Polygon",
    8: "MultiPoint"
};

function readBBox(stream) {
    return [stream.f64le(), stream.f64le(), stream.f64le(), stream.f64le()];
}

function readPoints(stream, count) {
    var points = [],
        i;
    points.length = count;
    for (i = 0; i < count; ++i) {
        points[i] = [stream.f64le(), stream.f64le()];
    }
    return points;
}

function readPointShape(stream, record) {
    record.coordinates = readPoints(stream, 1)[0];
}

function readPolylineShape(stream, record) {
    var bbox = readBBox(stream),
        numParts = stream.ui32le(),
        numPoints = stream.ui32le(),
        parts = [],
        points,
        i,
        rings = [];
    parts.length = rings.length = numParts;
    for (i = 0; i < numParts; ++i) {
        parts[i] = stream.ui32le();
    }
    points = readPoints(stream, numPoints);
    for (i = 0; i < numParts; ++i) {
        rings[i] = points.slice(parts[i], parts[i + 1] || numPoints);
    }
    record.bbox = bbox;
    record.coordinates = rings;
}

function readMultipointShape(stream, record) {
    record.bbox = readBBox(stream);
    record.coordinates = readPoints(stream, stream.ui32le());
}

var SHP_RECORD_PARSERS = {
    0: noop,
    1: readPointShape,
    3: readPolylineShape,
    5: readPolylineShape,
    8: readMultipointShape
};

function parseShpRecord(stream, generalType, errors) {
    var record = { number: stream.ui32be() },
        length = stream.ui32be() << 1,
        pos = stream.pos(),
        shapeType = stream.ui32le();

    record.type = SHP_TYPES[shapeType];
    if (record.type) {
        if (record.type !== generalType) {
            errors.push("shp: shape #" + record.number + " type: " + record.type + " / expected: " + generalType);
        }
        SHP_RECORD_PARSERS[shapeType](stream, record);
        pos = stream.pos() - pos;
        if (pos !== length) {
            errors.push("shp: shape #" + record.number + " length: " + length + " / actual: " + pos);
        }
    } else {
        errors.push("shp: shape #" + record.number + " type: " + shapeType + " / unknown");
        record = null;
    }
    return record;
}

function parseDbf(stream, errors) {
    var timeStart,
        timeEnd,
        header,
        parseData,
        records;
    try {
        timeStart = new Date();
        header = parseDbfHeader(stream, errors);
        parseData = prepareDbfRecordParseData(header, errors);
        records = parseDbfRecords(stream, header.numberOfRecords, header.recordLength, parseData, errors);
        timeEnd = new Date();
    }
    catch (e) {
        errors.push("dbf: parsing error: " + e.message + " / " + e.description);
    }
    finally {
        return { records: records, errors: errors, time: timeEnd - timeStart };
    }
}

function parseDbfHeader(stream, errors) {
    var i,
        header = {
            versionNumber: stream.ui8(),
            lastUpdate: new Date(1900 + stream.ui8(), stream.ui8() - 1, stream.ui8()),
            numberOfRecords: stream.ui32le(),
            headerLength: stream.ui16le(),
            recordLength: stream.ui16le(),
            fields: []
        },
        term;
    stream.skip(20);
    for (i = (header.headerLength - stream.pos() - 1) / 32; i > 0; --i) {
        header.fields.push(parseFieldDescriptor(stream));
    }
    term = stream.ui8();
    if (term !== 13) {
        errors.push("dbf: header terminator: " + term + " / expected: 13");
    }
    return header;
}

var _fromCharCode = String.fromCharCode;

function getAsciiString(stream, length) {
    return _fromCharCode.apply(null, stream.ui8arr(length));
}

function parseFieldDescriptor(stream) {
    var desc = {
        name: getAsciiString(stream, 11).replace(/\0*$/gi, ''),
        type: _fromCharCode(stream.ui8()),
        length: stream.skip(4).ui8(),
        count: stream.ui8()
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
        i = 0,
        ii = header.fields.length,
        item, field,
        totalLength = 0;
    for (i = 0; i < ii; ++i) {
        field = header.fields[i];
        item = {
            name: field.name,
            parser: DBF_FIELD_PARSERS[field.type],
            length: field.length
        };
        if (!item.parser) {
            item.parser = DBF_FIELD_PARSER_DEFAULT;
            errors.push("dbf: field " + field.name + " type: " + field.type + " / unknown");
        }
        totalLength += field.length;
        list.push(item);
    }
    if (totalLength + 1 !== header.recordLength) {
        errors.push("dbf: record length: " + header.recordLength + " / actual: " + (totalLength + 1));
    }
    return list;
}

function parseDbfRecords(stream, recordCount, recordLength, parseData, errors) {
    var i,
        j,
        jj = parseData.length,
        pos,
        records = [],
        record,
        pd;
    for (i = 0; i < recordCount; ++i) {
        record = {};
        pos = stream.pos();
        stream.skip(1);
        for (j = 0; j < jj; ++j) {
            pd = parseData[j];
            record[pd.name] = pd.parser(stream, pd.length);
        }
        pos = stream.pos() - pos;
        if (pos !== recordLength) {
            errors.push("dbf: record #" + (i + 1) + " length: " + recordLength + " / actual: " + pos);
        }
        records.push(record);
    }
    return records;
}

function wrapBuffer(arrayBuffer) {
    return new DataView(arrayBuffer);
}

function ui8(stream, position) {
    return stream.getUint8(position);
}

function ui16le(stream, position) {
    return stream.getUint16(position, true);
}

function ui32le(stream, position) {
    return stream.getUint32(position, true);
}

function ui32be(stream, position) {
    return stream.getUint32(position, false);
}

function f64le(stream, position) {
    return stream.getFloat64(position, true);
}

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

(function (tmp) {
    tmp = (tmp.DevExpress = tmp.DevExpress || {});
    tmp = (tmp.viz = tmp.viz || {});
    tmp.vectormaputils = { parse: parse };
}(window));

}(window));