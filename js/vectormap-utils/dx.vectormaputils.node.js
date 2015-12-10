/*! 
* DevExtreme (Vector Map)
* Version: 15.2.4
* Build date: Dec 8, 2015
*
* Copyright (c) 2012 - 2015 Developer Express Inc. ALL RIGHTS RESERVED
* EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
*/
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
                type: shape.gj_type || null,
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
            record = parseShpRecord(stream, header.type, errors);
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

function readPointShape(stream, record) {
    record.coordinates = readPointArray(stream, 1)[0];
}

function readPolyLineShape(stream, record) {
    var bbox = readBBox(stream),
        numParts = readInteger(stream),
        numPoints = readInteger(stream),
        parts = readIntegerArray(stream, numParts),
        points = readPointArray(stream, numPoints),
        rings = [],
        i;
    rings.length = numParts;
    for (i = 0; i < numParts; ++i) {
        rings[i] = points.slice(parts[i], parts[i + 1] || numPoints);
    }
    record.bbox = bbox;
    record.coordinates = rings;
}

function readMultiPointShape(stream, record) {
    record.bbox = readBBox(stream);
    record.coordinates = readPointArray(stream, readInteger(stream));
}

function readPointMShape(stream, record) {
    record.coordinates = readPointArray(stream, 1)[0];
    record.coordinates.push(readDoubleArray(stream, 1)[0]);
}

function readMultiPointMShape(stream, record) {
    var bbox = readBBox(stream),
        numPoints = readInteger(stream),
        points = readPointArray(stream, numPoints),
        mbox = readPair(stream),
        mvalues = readDoubleArray(stream, numPoints);
    record.bbox = bbox;
    record.mbox = mbox;
    record.coordinates = merge_xym(points, mvalues, numPoints);
}

function readPolyLineMShape(stream, record) {
    var bbox = readBBox(stream),
        numParts = readInteger(stream),
        numPoints = readInteger(stream),
        parts = readIntegerArray(stream, numParts),
        points = readPointArray(stream, numPoints),
        mbox = readPair(stream),
        mvalues = readDoubleArray(stream, numPoints),
        rings = [],
        i,
        from,
        to;
    rings.length = numParts;
    for (i = 0; i < numParts; ++i) {
        from = parts[i];
        to = parts[i + 1] || numPoints;
        rings[i] = merge_xym(points.slice(from, to), mvalues.slice(from, to), to - from);
    }
    record.bbox = bbox;
    record.mbox = mbox;
    record.coordinates = rings;
}

function readPointZShape(stream, record) {
    record.coordinates = readPointArray(stream, 1)[0];
    record.push(readDoubleArray(stream, 1)[0], readDoubleArray(stream, 1)[0]);
}

function readMultiPointZShape(stream, record) {
    var bbox = readBBox(stream),
        numPoints = readInteger(stream),
        points = readPointArray(stream, numPoints),
        zbox = readPair(stream),
        zvalues = readDoubleArray(stream, numPoints),
        mbox = readPair(stream),
        mvalue = readDoubleArray(stream, numPoints);
    record.bbox = bbox;
    record.zbox = zbox;
    record.mbox = mbox;
    record.coordinates = merge_xyzm(points, zvalues, mvalue, numPoints);
}

function readPolyLineZShape(stream, record) {
    var bbox = readBBox(stream),
        numParts = readInteger(stream),
        numPoints = readInteger(stream),
        parts = readIntegerArray(stream, numParts),
        points = readPointArray(stream, numPoints),
        zbox = readPair(stream),
        zvalues = readDoubleArray(stream, numPoints),
        mbox = readPair(stream),
        mvalues = readDoubleArray(stream, numPoints),
        rings = [],
        i,
        from,
        to;
    rings.length = numParts;
    for (i = 0; i < numParts; ++i) {
        from = parts[i];
        to = parts[i + 1] || numPoints;
        rings[i] = merge_xyzm(points.slice(from, to), zvalues.slice(from, to), mvalues.slice(from, to), to - from);
    }
    record.bbox = bbox;
    record.zbox = zbox;
    record.mbox = mbox;
    record.coordinates = rings;
}

function readMultiPatchShape(stream, record) {
    var bbox = readBBox(stream),
        numParts = readInteger(stream),
        numPoints = readInteger(stream),
        parts = readIntegerArray(stream, numParts),
        partTypes = readIntegerArray(stream, numParts),
        points = readPointArray(stream, numPoints),
        zbox = readPair(stream),
        zvalues = readDoubleArray(stream, numPoints),
        mbox = readPair(stream),
        mvalues = readDoubleArray(stream, numPoints),
        rings = [],
        i,
        from,
        to;
    rings.length = numParts;
    for (i = 0; i < numParts; ++i) {
        from = parts[i];
        to = parts[i + 1] || numPoints;
        rings[i] = merge_xyzm(points.slice(from, to), zvalues.slice(from, to), mvalues.slice(from, to), to - from);
    }
    record.bbox = bbox;
    record.zbox = zbox;
    record.mbox = mbox;
    record.types = partTypes;
    record.coordinates = rings;
}

var SHP_TYPES = {
    0: "Null",
    1: "Point",
    3: "PolyLine",
    5: "Polygon",
    8: "MultiPoint",
    11: "PointZ",
    13: "PolyLineZ",
    15: "PolygonZ",
    18: "MultiPointZ",
    21: "PointM",
    23: "PolyLineM",
    25: "PolygonM",
    28: "MultiPointM",
    31: "MultiPatch"
};

var SHP_RECORD_PARSERS = {
    0: noop,
    1: readPointShape,
    3: readPolyLineShape,
    5: readPolyLineShape,
    8: readMultiPointShape,
    11: readPointZShape,
    13: readPolyLineZShape,
    15: readPolyLineZShape,
    18: readMultiPointZShape,
    21: readPointMShape,
    23: readPolyLineMShape,
    25: readPolyLineMShape,
    28: readMultiPointMShape,
    31: readMultiPatchShape
};

var SHP_TYPE_TO_GEOJSON_TYPE_MAP = {
    "Null": "Null",
    "Point": "Point",
    "PolyLine": "MultiLineString",
    "Polygon": "Polygon",
    "MultiPoint": "MultiPoint",
    "PointZ": "Point",
    "PolyLineZ": "MultiLineString",
    "PolygonZ": "Polygon",
    "MultiPointZ": "MultiPoint",
    "PointM": "Point",
    "PolyLineM": "MultiLineString",
    "PolygonM": "Polygon",
    "MultiPointM": "MultiPoint",
    "MultiPatch": "MultiPatch"
};

function parseShpHeader(stream) {
    var header = {};
    header.fileCode = stream.ui32be();
    stream.skip(20);
    header.fileLength = stream.ui32be() << 1;
    header.version = stream.ui32le();
    header.type_number = stream.ui32le();
    header.type = SHP_TYPES[header.type_number];
    header.bbox_xy = readBBox(stream);
    header.bbox_zm = readPointArray(stream, 2);
    return header;
}

function readInteger(stream) {
    return stream.ui32le();
}

function readIntegerArray(stream, length) {
    var array = [],
        i;
    array.length = length;
    for (i = 0; i < length; ++i) {
        array[i] = readInteger(stream);
    }
    return array;
}

function readDoubleArray(stream, length) {
    var array = [],
        i;
    array.length = length;
    for (i = 0; i < length; ++i) {
        array[i] = stream.f64le();
    }
    return array;
}

function readBBox(stream) {
    return readDoubleArray(stream, 4);
}

function readPair(stream) {
    return [stream.f64le(), stream.f64le()];
}

function readPointArray(stream, count) {
    var points = [],
        i;
    points.length = count;
    for (i = 0; i < count; ++i) {
        points[i] = readPair(stream);
    }
    return points;
}

function merge_xym(xy, m, length) {
    var array = [],
        i;
    array.length = length;
    for (i = 0; i < length; ++i) {
        array[i] = [xy[i][0], xy[i][1], m[i]];
    }
    return array;
}

function merge_xyzm(xy, z, m, length) {
    var array = [],
        i;
    array.length = length;
    for (i = 0; i < length; ++i) {
        array[i] = [xy[i][0], xy[i][1], z[i], m[i]];
    }
    return array;
}

function parseShpRecord(stream, generalType, errors) {
    var record = { number: stream.ui32be() },
        length = stream.ui32be() << 1,
        pos = stream.pos(),
        type = stream.ui32le();

    record.type_number = type;
    record.type = SHP_TYPES[type];
    record.gj_type = SHP_TYPE_TO_GEOJSON_TYPE_MAP[record.type];
    if (record.type) {
        if (record.type !== generalType) {
            errors.push("shp: shape #" + record.number + " type: " + record.type + " / expected: " + generalType);
        }
        SHP_RECORD_PARSERS[type](stream, record);
        pos = stream.pos() - pos;
        if (pos !== length) {
            errors.push("shp: shape #" + record.number + " length: " + length + " / actual: " + pos);
        }
    } else {
        errors.push("shp: shape #" + record.number + " type: " + type + " / unknown");
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

function wrapBuffer(buffer) {
    return buffer;
}

function ui8(stream, position) {
    return stream[position];
}

function ui16le(stream, position) {
    return stream.readUInt16LE(position);
}

function ui32le(stream, position) {
    return stream.readUInt32LE(position);
}

function ui32be(stream, position) {
    return stream.readUInt32BE(position);
}

function f64le(stream, position) {
    return stream.readDoubleLE(position);
}

var fs = require("fs");
function sendRequest(path, callback) {
    fs.readFile(path, callback);
}

module.exports.parse = parse;
var path = require("path");

function normalizeJsName(value) {
    return value.trim().replace('-', '_').replace(' ', '_');
}

function processFile(file, options, callback) {
    var fileName = path.basename(file, path.extname(file));
    options.info("%s: started", fileName);
    parse(file, { precision: options.precision }, function (shapeData, errors) {
        options.info("%s: finished", fileName);
        errors && errors.forEach(function (e) {
            options.error("  " + e);
        });
        if (shapeData) {
            fs.writeFile(
                path.resolve(options.output || path.dirname(file), fileName + options.ext),
                options.wrapContent(JSON.stringify(options.processData(shapeData), null, options.indent), fileName),
                function (e) {
                    e && options.error("  " + e.message);
                    callback();
                });
        } else {
            callback();
        }
    });
}

function collectFiles(input, done) {
    input = path.resolve(input || "");
    fs.stat(input, function (e, stat) {
        if (e) {
            done(e, []);
        } else if (stat.isFile()) {
            done(null, checkFile(input) ? [path.resolve(path.dirname(input), normalizeFile(input))] : []);
        } else if (stat.isDirectory()) {
            fs.readdir(input, function (e, dirItems) {
                var list = [];
                dirItems.forEach(function (dirItem) {
                    if (checkFile(dirItem)) {
                        list.push(path.resolve(input, normalizeFile(dirItem)));
                    }
                });
                done(null, list);
            });
        } else {
            done(null, []);
        }
    });

    function checkFile(name) {
        return path.extname(name).toLowerCase() === ".shp";
    }

    function normalizeFile(name) {
        return path.basename(name, ".shp");
    }
}

function getDataProcessor(val) {
    var func = isFunction(val) && val;
    if (!func && val) {
        try {
            func = require(path.resolve(String(val)));
        } catch (_) { }
    }
    return isFunction(func) ? func : eigen;
}

function getContentWrapper(namespace, isDebug) {
    var p1 = namespace ? normalizeJsName(String(namespace)) + "." : "",
        p2 = isDebug ? " = " : "=";
    return function (content, name) {
        return p1 + normalizeJsName(name) + p2 + content;
    };
}

function prepareSettings(options) {
    options = options || {};
    var settings = {
        input: options.input ? String(options.input) : null,
        output: options.output ? String(options.output) : null,
        precision: options.precision >= 0 ? Number(options.precision) : 4,
        ext: options.isJson ? ".json" : ".js",
        indent: options.isDebug ? 4 : undefined,
        wrapContent: options.isJson ? eigen : getContentWrapper(options.namespace, options.isDebug),
        processData: getDataProcessor(options.processData)
    };
    settings.info = options.isQuiet ? noop : console.info.bind(console);
    settings.error = options.isQuiet ? noop : console.error.bind(console);
    return settings;
}

function processFiles(options, callback) {
    var settings = prepareSettings(options);
    settings.info("Started");
    collectFiles(settings.input, function (e, files) {
        e && settings.error(e.message);
        settings.info(files.map(function (file) {
            return "  " + path.basename(file);
        }).join("\n"));
        when(files.map(function (file) {
            return function (done) {
                processFile(file, settings, done);
            };
        }), function () {
            settings.info("Finished");
            (isFunction(callback) ? callback : noop)();
        });
    });
}

module.exports.processFiles = processFiles;

var COMMAND_LINE_ARG_KEYS = [
    { key: "--input", name: "input", arg: true, desc: "Directory containing source shapefiles" },
    { key: "--output", name: "output", arg: true, desc: "Destination directory" },
    { key: "--process-data", name: "processData", arg: true, desc: "Process parsed data" },
    { key: "--precision", name: "precision", arg: true, desc: "Precision of shape coordinates" },
    { key: "--namespace", name: "namespace", arg: true, desc: "Global variable where to put data" },
    { key: "--json", name: "isJson", desc: "Generate as a .json file" },
    { key: "--debug", name: "isDebug", desc: "Generate non minified file" },
    { key: "--quiet", name: "isQuiet", desc: "Suppress console output" },
    { key: "--help", name: "isHelp", desc: "Print help" }
];

function parseCommandLineArgs(commandLineArgKeys) {
    var args = process.argv.slice(2),
        options = { isEmpty: !args.length },
        map = {};
    args.forEach(function (arg, i) {
        map[arg] = args[i + 1] || true;
    });
    commandLineArgKeys.forEach(function (info) {
        var val = map[info.key];
        if (val) {
            options[info.name] = info.arg ? val : true;
        }
    });
    return options;
}

function printCommandLineHelp(desctiption, commandLineArgKeys) {
    var parts = ["node ", path.basename(process.argv[1]), " "],
        lines = [],
        maxLength = Math.max.apply(null, commandLineArgKeys.map(function (info) {
            return info.key.length;
        })) + 2,
        message;
    commandLineArgKeys.forEach(function (info) {
        var key = info.key;
        parts.push(key, " ");
        if (info.arg) {
            parts.push("<", key.slice(2), ">", " ");
        }
        lines.push(["  ", key, Array(maxLength - key.length).join(" "), info.desc].join(""));
    });
    message = [desctiption, "\n", parts.join("")].concat(lines).join("\n");
    console.log(message);
}

function runFromConsole() {
    var args = parseCommandLineArgs(COMMAND_LINE_ARG_KEYS);
    if (args.isHelp || args.isEmpty) {
        return printCommandLineHelp("Generates dxVectorMap-compatible files from shapefiles.", COMMAND_LINE_ARG_KEYS);
    }
    processFiles(args);
}

if (require.main === module) {
    runFromConsole();
}
