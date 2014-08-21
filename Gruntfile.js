// Generated on 2014-01-16 using generator-mobile 0.0.2
'use strict';
var LIVERELOAD_PORT = 35727;
var lrSnippet = require('connect-livereload')({
	port : LIVERELOAD_PORT
});
var mountFolder = function(connect, dir) {
	return connect.static(require('path').resolve(dir));
};


// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function(grunt) {
	// show elapsed time at the end
	// Time how long tasks take. Can help when optimizing build times
	require('time-grunt')(grunt);

	// load all grunt tasks
	require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

	var path = require('path');
	var prompt = require('prompt');
	// configurable paths
	var yeomanConfig = {
		app : 'dev',
		dist : 'dist',
	};

	var bowerConfig = {
		path : yeomanConfig.app + '/bower_components'
	};

	var pkgConfig = {
		name : '',
		description : '',
		version : '0.1',
		source : yeomanConfig.app + '/scripts',
		doc : 'doc',
	}

	grunt
			.initConfig({
				yeoman : yeomanConfig,
				pkg : pkgConfig,
				bowerConfig	 : bowerConfig,
				watch : {
					js : {
						files : [ '<%= yeoman.app %>/scripts/{,*/}*.js' ],
						tasks : [ 'concat:graph','jshint' ],
						options : {
							livereload : true
						}
					},
					tpl : {
						files : [ '<%= yeoman.app %>/scripts/{,*/}*.html',
								'<%= yeoman.app %>/scripts/js/tpl/{,*/}*.html' ],
						options : {
							livereload : true
						}
					},
					graphics : {
						files : [ '<%= yeoman.app %>/graphics/{,*/}{png,jpg,jpeg,gif,webp,svg}' ],
					},
					
					livereload : {
						options : {
							livereload : LIVERELOAD_PORT,

						},
						files : [
								'<%= yeoman.app %>/player/*.html',
								'{.tmp,<%= yeoman.app %>}/styles/{,*/}*.css',
								'{.tmp,<%= yeoman.app %>}/scripts/{,*/}*.js',
								'{.tmp,<%= yeoman.app %>}/scripts/**/{,*/}*.js',
								'<%= yeoman.app %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
								'<%= yeoman.app %>/pics/{,*/}*.{png,jpg,jpeg,gif,webp,svg}' ]
					},
				},
				autoshot : {
					default_options : {
						options : {
							// necessary config
							path : 'screenshots/',
							filename : '',
							type : 'PNG',
							// optional config, must set either remote or local
							remote : 'http://localhost:<%= connect.options.port %>',
							viewport : [ '320x480', '480x320', '384x640',
									'640x384', '602x963', '963x602', '600x960',
									'960x600', '800x1280', '1280x800',
									'768x1024', '1024x768' ]
						},
					},
				},

				responsive_images : {
					dev : {
						options : {
							sizes : [ {
								width : 320,
							}, {
								width : 640
							}, {
								width : 1024
							} ]
						},
						files : [ {
							expand : true,
							cwd : '<%= yeoman.app %>/images',
							src : '{,*/}*.{png,jpg,jpeg}',
							dest : '<%= yeoman.dist %>/images'
						} ]
					}
				},
				connect : {
					options : {
						port : 9005,
						// change this to '0.0.0.0' to access the server from outside
						//  hostname: 'localhost'
						hostname : '0.0.0.0',
						middlewhere : function(connect) {
							return [ function(req, res, next) {
								next();
								  }]
						}
					},
					livereload : {
						options : {
							middleware : function(connect) {
								return [
										lrSnippet,
										mountFolder(connect, '.tmp'),
										mountFolder(connect, yeomanConfig.app),
										function(req, res, next) {
											next();
										} ];
							}
						}
					},
					test : {
						options : {
							middleware : function(connect) {
								return [ mountFolder(connect, '.tmp'),
										mountFolder(connect, 'test') ];
							}
						}
					},
					dist : {
						options : {
							middleware : function(connect) {
								return [ 
								        ountFolder(connect, yeomanConfig.dist) ];
							}
						}
					}
				},
				open : {
					server : {
						path : 'http://localhost:<%= connect.options.port %>/player/demo.html'
					}
				},
				clean : {
					dist : {
						files : [ {
							dot : true,
							src : [ '.tmp', '<%= yeoman.dist %>/*',
									'!<%= yeoman.dist %>/.git*',
									'!<%= yeoman.dist %>/config.xml'

							]
						} ]
					},
					server : '.tmp'
				},
				jshint : {
					options : {
						jshintrc : '.jshintrc',
						reporter : require('jshint-stylish')
					},
					all : [ 'Gruntfile.js',
							'<%= yeoman.app %>/scripts/**/*.js',
							'test/spec/{,*/}*.js' ]
				},
				yuidoc : {
					compile : {
						name : '<%= pkg.name %>',
						description : '<%= pkg.description %>',
						version : '<%= pkg.version %>',
						url : '',
						options : {
							paths : '<%= pkg.source %>',
							outdir : '<%= pkg.doc %>/api'
						}
					}
				},
				todo : {
					options : {
						marks : [ {
							name : "FIX",
							pattern : /FIXME/,
							color : "red"
						}, {
							name : "TODO",
							pattern : /TODO/,
							color : "yellow"
						}, {
							name : "NOTE",
							pattern : /NOTE/,
							color : "blue"
						} ],
					// file: "report.md",
					},
					script : [ '<%= yeoman.app %>/scripts/**/*' ],
					styles : [ '<%= yeoman.app %>/styles/**/*' ],
					test : [ 'test/*' ]
				},
				mocha : {
					all : {
						options : {
							run : true,
							urls : [ 'http://localhost:<%= connect.options.port %>/index.html' ]
						}
					}
				},
				mochaTest : {
					test : {
						options : {
							reporter : 'spec'
						},
						src : [ 'test/**/*.js' ]
					}
				},
				
				
				// not used since Uglify task does concat,
				// but still available if needed

				concat : {
					dev : {
						src : [ 'source/scripts/prod.js',
								'source/scripts/dev.js' ],
						dest : 'source/scripts/main.js',
					},
					prod : {
						src : [ 'source/scripts/prod.js' ],
						dest : 'source/scripts/main.js',
					},
					graph:{
						src : [ '<%= yeoman.app %>/scripts/beginspringy.js',
						        '<%= yeoman.app %>/scripts/math.js',
						        '<%= yeoman.app %>/scripts/graph.js',
						        '<%= yeoman.app %>/scripts/layout-forcedirect.js',
						        '<%= yeoman.app %>/scripts/render.js',
						        '<%= yeoman.app %>/scripts/helpers.js',
						        '<%= yeoman.app %>/scripts/endspringy.js',				        
						        ],
						dest : '<%= yeoman.app %>/scripts/springy.js',
					}

				},

				useminPrepare : {
					options : {
						dest : '<%= yeoman.dist %>'
					},
					html : '<%= yeoman.app %>/index.html'
				},
				usemin : {
					options : {
						dirs : [ '<%= yeoman.dist %>' ]
					},
					html : [ '<%= yeoman.dist %>/{,*/}*.html' ],
				// css : [ '<%= yeoman.dist %>/styles/{,*/}*.css' ]
				},
				imagemin : {
					dist : {
						files : [ {
							expand : true,
							cwd : '<%= yeoman.app %>/styles/images',
							src : '{,*/}*.{png,jpg,jpeg}',
							dest : '<%= yeoman.dist %>/styles/images'
						} ]
					}
				},
				svgmin : {
					dist : {
						files : [ {
							expand : true,
							cwd : '<%= yeoman.app %>/images',
							src : '{,*/}*.svg',
							dest : '<%= yeoman.dist %>/images'
						} ]
					}
				},
				cssmin : {
					options : {
						keepSpecialComments : 0
					},
					css : {
						expand : true,
						cwd : 'public/css/',
						src : [ 'main.css', '!*.min.css' ],
						dest : '<%= yeoman.dist %>/styles/css/main',
						ext : '.min.css',
						options : {
							keepSpecialComments : 0
						}
					}
				},
				// cssmin : {
				// dist : {
				// files : {
				// '<%= yeoman.dist %>/styles/css/main.css' : [
				// '.tmp/styles/{,*/}*.css', '<%= yeoman.app
				// %>/styles/{,*/}*.css' ]
				// }
				// }
				// },
				htmlmin : {
					dist : {
						options : {
						/*
						 * removeCommentsFromCDATA: true, //
						 * https://github.com/yeoman/grunt-usemin/issues/44
						 * //collapseWhitespace: true,
						 * collapseBooleanAttributes: true,
						 * removeAttributeQuotes: true,
						 * removeRedundantAttributes: true, useShortDoctype:
						 * true, removeEmptyAttributes: true,
						 * removeOptionalTags: true
						 */
						},
						files : [ {
							expand : true,
							cwd : '<%= yeoman.app %>',
							src : '*.html',
							dest : '<%= yeoman.dist %>'
						} ]
					}
				},
				// Put files not handled in other tasks here
				copy : {
					dist : {
						files : [
								{
									expand : true,
									dot : true,
									cwd : '<%= yeoman.app %>',
									dest : '<%= yeoman.dist %>',
									src : [
											'*.{ico,png,txt}',
											'.htaccess',
											'images/{,*/}*.{webp,gif}',
											'styles/fonts/*',
											'styles/css/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}', ]
								},
								{
									expand : true,
									cwd : '.tmp/images',
									dest : '<%= yeoman.dist %>/images',
									src : [ 'generated/*' ]
								},
								{
									expand : true,
									cwd : '<%= yeoman.app %>',
									dest : '<%= yeoman.dist %>',
									src : [ 'styles/font/{,*/}*', ]
								},
								{
									expand : true,
									cwd : '<%= yeoman.app %>',
									dest : '<%= yeoman.dist %>',
									src : [ 'scripts/tpl/{,*/}*',

									]
								},
//								{
//									expand : true,
//									cwd : '<%= yeoman.app %>',
//									dest : '<%= yeoman.dist %>',
//									src : [ 'scripts/js/**/{,*/}*',
//
//									]
//								},
								{
									expand : true,
									cwd : '<%= yeoman.app %>',
									dest : '<%= yeoman.dist %>',
									src : [
											'graphics/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',

									]
								} ]
					},
			
				},
			
				bower : {
					options : {
						exclude : [ 'modernizr' ]
					},
					all : {
						rjsConfig : '<%= yeoman.app %>/scripts/main.js'
					}
				},

			});

	grunt.registerTask('server', function(target) {
		//TODO setup to support springy project
		grunt.event.on('watch', function(action, filepath) {
			// grunt.log.writeln(action,filepath);
			grunt.log.writeln();
			grunt.log.writeln("-----------------------");
			grunt.log.writeln("file name: " + filepath + " has been " + action);
			grunt.log.writeln("-----------------------");
			
			grunt.log.writeln("***********************");
			grunt.log.writeln("running in server debug mode. sync this action with " +  yeomanConfig.dist); 
			return grunt.task.run(['concat:graph']);
		});
		
		
		if (target === 'dist') {
			return grunt.task
					.run([ 'build', 'connect:dist:keepalive', 'open:server']);
		//TODO setup to support springy project
		} else if (target === 'dev') {
			return grunt.task.run([ 'clean:server','connect:livereload', 'open:server',
					'watch' ]);
		}

		
		grunt.task.run(['concat:graph','clean:server','connect:livereload', 'open:server', 'watch' ]);
	});

	grunt.registerTask('test', [ 'clean:server', 'concurrent:test',
			'connect:test', 'mocha' ]);
	
	//TODO setup to support springy project
	grunt.registerTask('build', [ 'clean:dist', 'useminPrepare',
			, 'concat:graph',
			'concurrent:dist',
			'copy:dist', 'usemin', ]);
//	grunt.registerTask('build', [ 'clean:dist', 'concat:prod', 'useminPrepare',
//	                  			'concat:generated', 'concat:graph',
//	                  			'concurrent:dist',
//	                  			'copy:dist', 'usemin', ]);
//	
	//TODO setup to support springy project
	grunt.registerTask('default', 'mochaTest');

	//TODO setup to support springy project
	grunt.registerTask('default', [ 'newer:jshint', 'test', 'build' ]);

	//TODO setup to support springy project
	grunt.registerTask('screenshots', [ 'clean:server', 'concurrent:server',
			'connect:livereload', 'autoshot' ]);

	// on watch events configure jshint:all to only run on changed file

};
