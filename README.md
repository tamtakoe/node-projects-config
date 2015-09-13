# node-projects-config [![NPM version](https://badge.fury.io/js/projects-config.svg)](http://badge.fury.io/js/projects-config)

> Loading configs for projects based on environment variable

## Install with [npm](npmjs.org)

```sh
npm install projects-config
```

## Usage
F. e. we have two projects: `main`, `admin` and two types of environments: `dev`, `production`

```
configs/                       * local configs
 ├──admin/
 │   └──production.json     { secretKey: 'YYYY' }
 │
projects/
 ├──admin/
 │   ├──config/                * public config
 │   │   └──default.json      { resources: {adminApi: '//admin.mysite.com/api'} }
 │   │
 │   └──otherFiles
 │
 └──main/
      ├──config/               * public config
      │   ├──default.json     { resources: {geoApi: '//maps.googleapis.com/maps/api/js'} }
      │   ├──dev.json         { resources: {api: '//dev.mysite.com/api'} }
      │   └──production.json  { resources: {api: '//mysite.com/api'} }
      │
      └──otherFiles
```

```js
var configs = require('projects-config');
process.env.NODE_ENV = 'production';

configs.load('projects/**/config', 'configs');

console.log(configs.admin.secretKey) //'YYYY'
```

Configs for `production`
```js
{
    admin: {
       resources: {
           api: '//mysite.com/api',
           geoApi: '//maps.googleapis.com/maps/api/js',
           adminApi: '//admin.mysite.com/api',
       },
       secretKey: 'YYYY'
   },
   main: {
      resources: {
          api: '//mysite.com/api',
          geoApi: '//maps.googleapis.com/maps/api/js'
      }
  }
}
```

## Features

Plugin provides `json`, `json5`, `hjson`, `toml`, `yaml`, `cson`, `properties` file formats. It uses loader from [node-config](https://github.com/lorenwest/node-config/wiki/Configuration-Files#file-formats)

## API
### configs.load([publicPath][, localPath][, params])

Load configs from config's directories to `configs` object

#### publicPath
Type: `String`

Default: `'config'`

The path pattern to the directory with the public configurations. [About glob patterns](https://www.npmjs.com/package/glob)
Plugin throws error if can not find config for current environment

#### localPath
Type: `String`

The path pattern to the directory with the local configurations. [About glob patterns](https://www.npmjs.com/package/glob)
Plugin doesn't throw error if can not find config for current environment. It will use the default configuration.
Local configs merge to public configs.
Usually local configs are stored only on the local machine (not in the repository)

#### params

##### env
Type: `String`

Default: `process.env.NODE_ENV`

Environment

##### project
Type: `String`

Default: `process.env.PROJECT`

Set project name if you need result configs for one project. Set `undefined/false/null` or `'*'` for all projects


##### defaultFileName
Type: `String`

Default: `'default'`

File name (without extention) of default config

##### defaults
Type: `Object/Function`

Default: `function(env, projectName) { return {env: env, project: projectName}; };`

Sets default structure for each config. You can use this as link on config object

```js
function setDefaultConfig(env, projectName) {
    return {
        project: projectName
        public: {}
        private: {
            public: this.public
        }
    };
}
```

### configs.stream([params])

Create projects config stream

```js
configs.stream({section: 'public.resources'})
    .pipe(gulp.dest(compiledPath));
``` 

configs object
```js
{
    project1: {
        public: {
            resources: 'resource1'
        }
    },
    project2: {
        public: {
            resources: 'resource2'
        }
    }
}
```

config.js
```js
{
    project1: 'resource1',
    project2: 'resource2'
}
```

#### params

##### name
Type: `String`

Default: `config.js`

File name

##### section
Type: `String`

Part of config which will be used for forming of config file

##### stringifySpace
Type: `Number`

Default: `4`

Number of whitespaces of `JSON.stringify`

 
### configs.forEach([section,] callback)

Executes a provided function once per project. If iterated part of configs is an array it will be provided function once per array element

configs object
```js
{
    admin: {
        webserver: {port: 7001}
    },
    main: {
        webserver: [
            {port: 7002},
            {port: 7003}
        ]
    }
}
```

```js
configs.forEach('webserver', function(config, projectName) {
    console.log(projectName, config);
})

//log:
//admin {port: 7001}
//main {port: 7002}
//main {port: 7003}
```

#### params

##### section
Type: `String`

Part of config which will be used for forming of config file


##### callback
Type: `Function`

Function to execute for each element, taking two arguments:

`config` project config or section of project config

`projectName` project name

#### returns
Type: `Stream`

Total stream composed of streams which were returned in callbacks


### configs.reduce(callback)

Applies a function against an accumulator and each project config (from left-to-right) to reduce it to a single stream.
Wrap of [lodash reduce](https://lodash.com/docs#reduce)

### configs.reduceRight(callback)

Applies a function against an accumulator and each project config (from left-to-right) to reduce it to a single stream.
Wrap of [lodash reduceRight](https://lodash.com/docs#reduceRight)



## License

© Oleg Istomin 2015.
Released under the MIT license