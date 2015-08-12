#!/usr/bin/env node

var provision = require('./provision'),
	deploy = require('./deploy');

function packageDefaults(target, keys) {
	[].concat(keys).forEach(function(key) {
		var value = process.env['npm_package_deployment_' + key];

		if (value) {
			target[key].default = value;
		}
	});
}

var common = {
	name: {
		demand: true,
		describe: 'Microservice name, used as a resource prefix'
	},
	bucket: {
		demand: true,
		describe: 'S3 bucket for metadata storage'
	},
	region: {
		demand: true,
		default: 'us-east-1',
		describe: 'AWS region'
	},
	environment: {
		demand: true,
		describe: 'Environment name'
	}
};

packageDefaults(common, ['name', 'bucket']);

require('yargs').usage('Usage: microservice <command>')
	.command('provision', 'prepare aws for a microservice', function(yargs) {
		yargs.options(common);

		provision(yargs.argv);
	})
	.command('deploy', 'deploy a microservice', function(yargs) {
		var specific = {
			repo: {
				demand: true,
				describe: 'Docker repository'
			},
			tag: {
				demand: true,
				describe: 'Docker image tag'
			}
		};

		packageDefaults(specific, 'repo');

		yargs.options(common).options(specific);

		if (process.env.CIRCLE_SHA1) {
			yargs.default('tag', process.env.CIRCLE_SHA1);
		}

		deploy(yargs.argv);
	})
	.demand(1, 'Must provide a valid command')
	.argv;
