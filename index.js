process.env.SUPPRESS_NO_CONFIG_WARNING = true;

var fs      = require('fs');
var path    = require('path');
var through = require('through2');
var gutil   = require('gulp-util');
var glob    = require('glob');
var stream  = require('stream');
var series  = require('stream-series');
var config  = require('config');
var _       = require('lodash');

var AVAILABLE_FORMATS = ['json', 'json5', 'hjson', 'toml', 'iced', 'yaml', 'yml', 'cson', 'properties'];

function Config() {}

Config.prototype.load = function compile(publicPath, localPath, params) {
    if (typeof localPath === 'object') {
        params    = localPath;
        localPath = undefined;
    }

    if (typeof publicPath === 'object') {
        params     = publicPath;
        publicPath = undefined;
    }

    params     = params || {};
    publicPath = publicPath || 'config';
    params.env = params.env || process.env.NODE_ENV;

    var setDefaultConfig = typeof params.defaults === 'function' ? params.defaults : function(env, projectName) {
        return params.defaults || {env: env, project: projectName};
    };

    var def = params.defaultFileName || 'default',
        env = params.env || def;

    var publicDirPaths = publicPath ? glob.sync(publicPath, params) : [];
    var localDirPaths  = localPath  ? glob.sync(localPath, params)  : [];

    var publicConfigs = findConfigs(publicDirPaths);
    var localConfigs  = findConfigs(localDirPaths, {ignoreErrors: true});

    _.merge(this, publicConfigs, localConfigs, mergeWithoutArrays);

    function findConfigs(directoriesPaths, params) {
        var configs = {};

        directoriesPaths.forEach(function(dirPath) {
            loadConfigs(dirPath, path.basename(path.dirname(dirPath)), configs);
        });

        return combineConfigs(configs, params);
    }

    function loadConfigs(dirPath, project, configs) {
        var dirFilesPaths = fs.readdirSync(dirPath, 'utf8');

        dirFilesPaths.forEach(function(fileName) {
            var filePath = path.join(dirPath, fileName);

            if (fs.lstatSync(filePath).isDirectory()) {
                loadConfigs(filePath, path.basename(filePath), configs);

            } else {
                var env = path.basename(fileName, path.extname(fileName));

                configs[project] = configs[project] || {};
                configs[project][env] = readConfig(filePath);
            }
        });
    }

    function readConfig(filePath) {
        var ext = path.extname(filePath).substring(1);

        if (AVAILABLE_FORMATS.indexOf(ext) === -1) return;

        var file = fs.readFileSync(filePath, 'utf8');

        return config.util.parseString(file, ext);
    }

    function combineConfigs(configs, params) {
        params = params || {};

        var inheritedConfigs = {};

        _.forEach(configs, function(config, projectName) {
            var defaultConfig = config[def];
            var enviromentConfig = config[env];

            if (defaultConfig && defaultConfig.inherit) {
                inheritedConfigs[projectName] = defaultConfig.inherit;
            }

            if (!params.ignoreErrors && !enviromentConfig && (!defaultConfig || !defaultConfig.inherit)) {
                if (!defaultConfig.useIfNoEnv) {
                    throw new Error('Can not read "' + env + '" config for project "' + projectName +'"');
                }
            }

            var projectConfig = _.merge({}, defaultConfig, enviromentConfig, mergeWithoutArrays);
            var defaultProjectConfig = setDefaultConfig.call(projectConfig, env, projectName);

            configs[projectName] = _.merge(defaultProjectConfig, projectConfig);
        });

        _.forEach(inheritedConfigs, function(parentProjectName, projectName) {
            if (!configs[parentProjectName]) {
                throw new Error('Can not load ' + parentProjectName + ' config');
            }
            configs[projectName] = _.merge({}, configs[parentProjectName], configs[projectName], mergeWithoutArrays);
        });

        return configs;
    }

    function mergeWithoutArrays(oldValue, newValue) {
        if (_.isArray(oldValue)) {
            return newValue;
        }
    }

    return this;
};

Config.prototype.stream = function compile(params) {
    params = params || {};
    var stream = through.obj(),
        config = this,
        projectConfigs = {};

    function save(conf, project) {
        project = project || '';

        var file = new gutil.File({
            path: path.join(project, params.name || 'config.js'),
            contents: new Buffer(JSON.stringify(conf, null, params.stringifySpace || 4))
        });

        stream.write(file);
    }

    _.forEach(config, function(projectConfig, project) {
        projectConfigs[project] = _.get(projectConfig, params.section);
    });

    save(projectConfigs);

    process.nextTick(function() {
        return stream.end();
    });

    return stream;
};


Config.prototype.forEach = function(streams, selector, callback) {
    var projects = this;

    if (!selector && !callback) {
        callback = streams;
        streams = [];
    }

    if (!callback && typeof streams === 'string') {
        callback = selector;
        selector = streams;
        streams = [];
    }

    if (!callback && typeof streams === 'object') {
        callback = selector;
    }

    if (process.env.PROJECT !== '*') {
        projects = {};
        projects[process.env.PROJECT] = this[process.env.PROJECT];
    }

    _.forEach(projects, function(configs, projectName) {
        if (selector) {
            configs = _.get(configs, selector, {});
        } else {
            configs = configs || {};
        }

        configs = configs instanceof Array ? configs : [configs];

        configs.forEach(function(config) {
            var configStream = callback(config, projectName);

            if (configStream instanceof stream.Stream) {
                streams.push(configStream);
            }
        });
    });

    return streams.length ? series.apply(this, streams) : null;
};

Config.prototype.reduce = function(callback, initial, thisArg, right) {
    var projects = this;

    if (process.env.PROJECT !== '*') {
        projects = {};
        projects[process.env.PROJECT] = this[process.env.PROJECT];
    }

    return right ? _.reduceRight(projects, callback, initial) : _.reduce(projects, callback, initial);
};

Config.prototype.reduceRight = function(callback, initial, thisArg) {
    return this.reduce(callback, initial, thisArg, true);
};

module.exports = new Config();