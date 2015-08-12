var AWS = require('aws-sdk'),
	archiver = require('archiver'),
	async = require('async'),
	fs = require('fs'),
	rfile = require('rfile');

module.exports = function(args) {
	var $NAME = args.name;
	var $IMAGE = args.repo + '/' + $NAME;
	var $TAG = args.tag;

	var $S3_BUCKET = args.bucket;
	var $S3_KEY = '/applications/' + $NAME + '/' + $NAME + '-' + new Date().getTime() + '-' + $TAG + '.zip';

	var $ENVIRONMENT = args.environment;
	var $REGION = args.region;

	async.series([
		function(next) {
			//JSON.stringify({ gitSha: args.tag }).to('./gitSha.json');

			// docker build -t $IMAGE .
			// docker tag $IMAGE:latest $IMAGE:$TAG

			// Deploy image to Docker Registry
			// docker push $IMAGE},
			next();
		},
		function(next) {
			var archive = archiver('zip');
			var Dockerrun = rfile('./Dockerrun.aws.json.template')
				.replace(/<IMAGE>/, $IMAGE + ":" + $TAG)
				.replace(/<BUCKET>/, $S3_BUCKET);

			console.log(Dockerrun);

			archive.on('error', next);

			archive.append(Dockerrun, { name: 'Dockerrun.aws.json' });

			if (fs.existsSync('.ebextensions')) {
				archive.directory('.ebextensions');
			}

			archive.finalize();

			var s3 = new AWS.S3({ params: { Bucket: $S3_BUCKET, Key: $S3_KEY } });

			//s3.upload({ Body: archive }).send(next);
			next();
		}, function(next) {
			var elasticbeanstalk = new AWS.ElasticBeanstalk({apiVersion: '2010-12-01'});

			next();
		}
	], function(err) {
		console.log('done', err);
	});

		/*
		console.log(['aws', 'elasticbeanstalk', 'create-application-version', '--region',
					$REGION, '--application-name', $NAME, '--version-label', $TAG, '--source-bundle',
					'S3Bucket=' + $S3_BUCKET + ',S3Key=' + $ZIP_PATH].join(' '));

		// Update Elastic Beanstalk environment to new version
		console.log(['aws', 'elasticbeanstalk', 'update-environment', '--region', $REGION, '--environment-name', $ENVIRONMENT, '--version-label', $TAG].join(' '));
		*/
};
