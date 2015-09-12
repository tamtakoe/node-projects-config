# node-projects-config [![NPM version](https://badge.fury.io/js/projects-config.svg)](http://badge.fury.io/js/projects-config)

> Loading configs for projects based on environment variable

## Install with [npm](npmjs.org)

```sh
npm install projects-config
```

## Usage
F. e. we have two projects: `main`, `admin` and two types of environments: `dev`, `production`

```js
configs //local configs
|- admin
   |- production.json
projects
|- admin
   |- config //public config
      |- default.json
   |- otherFiles
|- main
    |- config //public config
      |- default.json
      |- dev.json
      |- production.json
   |- otherFiles
```

Contents
```js
//projects.main.config.default.json:
{
    resources: {
        geoApi: '//maps.googleapis.com/maps/api/js'
    }
}

//projects.main.config.dev.json:
{
    resources: {
        api: '//dev.mysite.com/api'
    }
}

//projects.main.config.production.json:
{
    resources: {
        api: '//mysite.com/api'
    }
}

//projects.admin.config.default.json:
{
    inherit: 'main'
    resources: {
        adminApi: '//admin.mysite.com/api'
    }
}

//configs.admin.production.json:
{
    secretKey: 'YYYY'
}
```



```js
var configs = require('projects-config');
process.env.NODE_ENV = 'production';

configs.load('projects/**/config', 'configs');

console.log(configs.admin.secretKey) //'YYYY'
```

All configs for `production`:
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

Plugin provides `json`, `json5`, `hjson`, `toml`, `yaml`, `cson`, `properties` file formats. It uses loader from [node-config](//github.com/lorenwest/node-config).
[More information](https://github.com/lorenwest/node-config/wiki/Configuration-Files#file-formats)

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

`configs`:
```js
{
    project1: {
        public: {
            resources: [1.1,1.2,1.3]
        },
        private: {
            resources: [1.5,1.6,1.7]
        }
    },
    project2: {
        public: {
            resources: [2.1,2.2,2.3]
        },
        private: {
            resources: [2.5,2.6,2.7]
        }
    }
}
```

`config.js`:
```js
{
    project1: [1.1,1.2,1.3],
    project2: [2.1,2.2,2.3]
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

    
### configs.forEach([streams,][selector,] callback)

Create projects config stream    

#### params

##### streams
Type: `Array`


##### selector
Type: `String`


##### callback
Type: `Function`


## License

© Oleg Istomin 2015.
Released under the MIT license