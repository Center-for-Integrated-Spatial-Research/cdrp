dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.layout.AccordionContainer");
dojo.require("dijit.TitlePane");
dojo.require("dijit.form.Button");
dojo.require("dijit.form.Select");
dojo.require("dijit.form.CheckBox");
dojo.require("dijit.form.HorizontalSlider");
dojo.require("dijit.form.HorizontalRuleLabels");
dojo.require("dijit.form.HorizontalRule")
dojo.require("dijit.TooltipDialog");
dojo.require("dijit.Tooltip");
dojo.require("dijit.registry");
dojo.require("dojox.fx");
dojo.require("dijit._Widget");
dojo.require("dojo.data.ItemFileReadStore");
dojo.require("dojox.grid.DataGrid");
dojo.require("dojox.charting.Chart2D");
dojo.require("dojox.charting.themes.Tom");
dojo.require("dojo.dnd.move");

dojo.require("esri.map");
dojo.require("esri.layers.FeatureLayer");
dojo.require("esri.tasks.geometry");

var map, streetsLayer, imageryLayer, grayLayer, grayLayerLabels, countiesFeatureLayer, districtsFeatureLayer, countiesTableFeatureLayer, districtsTableFeatureLayer, secondaryFeatureLayer, unifiedFeatureLayer, schoolFeatureLayer, highlightLayer, symbologyLayer, dialog, mevt, maxExtent, initExtent, initUpdate, tooltip, chart, dataTooltip, zoomEnd;
var activeFeatureLayer, values;
var output = [];
var years = ['910', '1011', '1112'];
var year = years[2];
var yearField = 'Data_' + year;
var maxOffset = 250;
var theme = rdBuTheme;
var themeColor = "rdBu";
//var classMethod = "natural breaks";
var schoolTableUrl = "http://arcgis.cisr.ucsc.edu/arcgis/rest/services/CDRP/CDRP_2012/MapServer/5";
var districtTableUrl = "http://arcgis.cisr.ucsc.edu/arcgis/rest/services/CDRP/CDRP_2012/MapServer/4";
var countyTableUrl = "http://arcgis.cisr.ucsc.edu/arcgis/rest/services/CDRP/CDRP_2012/MapServer/3";
var gsvc;
var geometryUrl = "http://arcgis.cisr.ucsc.edu/arcgis/rest/services/Geometry/GeometryServer";
var fieldMap = { 	
				"": { 	"field":["NumCohort","CohortGraduationRate","CohortDropoutRate","StillEnrolledRate","SpecialEdCompletersRate","GEDRate"], 
						"alias":["Cohort (#)","Cohort Graduation Rate","Cohort Dropout Rate","Still Enrolled Rate","Special Education Graduation Rate","GED Rate"],
						"width":[50,120,100,100,120,50],
						"mean":{"910": 0, "1011": 0, "1112": 0},
						"interval":5,
						"class_mean": 75
					},
				"CohortGraduationRate": { 
						"field":["NumCohort","NumGraduates","CohortGraduationRate"], 
						"alias":["Cohort (#)","Graduates (#)","Cohort Graduation Rate"] ,
						"width":[50,75,120],
						"mean":{"910": 74.7, "1011":  77.1, "1112":  78.9},
						"interval":5,
						"class_mean": 80
					},
				"CohortDropoutRate":{ 
						"field":["NumCohort","NumDropouts","CohortDropoutRate"], 
						"alias":["Cohort (#)","Dropouts (#)","Cohort Dropout Rate"],
						"width":[50,75,100],
						"mean":{"910": 16.6, "1011": 14.7, "1112": 13.1},
						"interval":5,
						"class_mean": 20	
					},
				"StillEnrolledRate":{ 
						"field":["NumCohort","NumStillEnrolled","StillEnrolledRate"], 
						"alias":["Cohort (#)","Still Enrolled (#)","Still Enrolled Rate"],
						"width":[50,75,100],
						"mean":{"910": 7.9, "1011": 7.4, "1112": 7.3},
						"interval":2,
						"class_mean": 8
					},
				"SpecialEdCompletersRate":{ 
						"field":["NumCohort","NumSpecialEducation","SpecialEdCompletersRate"], 
						"alias":["Cohort (#)","Special Education (#)","Special Education Completers Rate"],
						"width":[50,100,120],
						"mean":{"910": 0.4, "1011": 0.5, "1112": 0.6},
						"interval":0.15,
						"class_mean": 0.6
					},
				"GEDRate":{ 
						"field":["NumCohort","NumGED","GEDRate"], 
						"alias":["Cohort (#)","GED (#)","GED Rate"],
						"width":[50,50,50],
						"mean":{"910": 0.4, "1011": 0.3, "1112": 0.2},
						"interval":0.1,
						"class_mean": 0.4
					}
				};

var cohortMeans = {
	"All_All": { 
		"CohortGraduationRate": {"910": 74.72, "1011": 77.14, "1112": 78.87 },
		"CohortDropoutRate": { "910": 16.6, "1011": 14.7, "1112": 13.1 },
		"SpecialEdCompletersRate": { "910": 0.4, "1011": 0.5, "1112": 0.6 },
		"StillEnrolledRate": { "910": 7.9, "1011": 7.4, "1112": 7.3 },
		"GEDRate": { "910": 0.4, "1011": 0.3, "1112": 0.2 } 
	},
	"All_0": { 
		"CohortGraduationRate": {"910": 53.81, "1011": 49.59, "1112": 50.93 },
		"CohortDropoutRate": { "910": 41.6, "1011": 42, "1112": 37.3 },
		"SpecialEdCompletersRate": { "910": 0.3, "1011": 0.3, "1112": 0.4 },
		"StillEnrolledRate": { "910": 3.9, "1011": 7.8, "1112": 11.1 },
		"GEDRate": { "910": 0.4, "1011": 0.3, "1112": 0.3 } 
	},
	"All_1": { 
		"CohortGraduationRate": {"910": 67.32, "1011": 68.49, "1112": 72.36 },
		"CohortDropoutRate": { "910": 22.1, "1011": 21.4, "1112": 18.4 },
		"SpecialEdCompletersRate": { "910": 0.8, "1011": 0.6, "1112": 0.6 },
		"StillEnrolledRate": { "910": 9.4, "1011": 9.1, "1112": 8.2 },
		"GEDRate": { "910": 0.4, "1011": 0.4, "1112": 0.4 } 
	},
	"All_2": { 
		"CohortGraduationRate": {"910": 89.01, "1011": 90.34, "1112": 91.06 },
		"CohortDropoutRate": { "910": 7.2, "1011": 6, "1112": 5.5 },
		"SpecialEdCompletersRate": { "910": 0.2, "1011": 0.3, "1112": 0.3 },
		"StillEnrolledRate": { "910": 3.4, "1011": 3.2, "1112": 3 },
		"GEDRate": { "910": 0.1, "1011": 0.1, "1112": 0.1 } 
	},
	"All_3": {
		"CohortGraduationRate": {"910": 72.33, "1011": 74.89, "1112": 76.97 },
		"CohortDropoutRate": { "910": 19.6, "1011": 17.7, "1112": 15.4 },
		"SpecialEdCompletersRate": { "910": 0.4, "1011": 0.2, "1112": 0.6 },
		"StillEnrolledRate": { "910": 7.1, "1011": 7, "1112": 6.6 },
		"GEDRate": { "910": 0.5, "1011": 0.1, "1112": 0.3 } 
	},
	"All_4": {
		"CohortGraduationRate": {"910": 87.34, "1011": 89.86, "1112": 90.75 },
		"CohortDropoutRate": { "910": 7.8, "1011": 6.4, "1112": 5.3 },
		"SpecialEdCompletersRate": { "910": 0.4, "1011": 0.4, "1112": 0.5 },
		"StillEnrolledRate": { "910": 4.3, "1011": 3.3, "1112": 3.3 },
		"GEDRate": { "910": 0.2, "1011": 0.1, "1112": 0.1 } 
	},
	"All_5": { 
		"CohortGraduationRate": {"910": 68.08, "1011": 71.4, "1112": 73.7 },
		"CohortDropoutRate": { "910": 20.8, "1011": 18.3, "1112": 16.1 },
		"SpecialEdCompletersRate": { "910": 0.4, "1011": 0.5, "1112": 0.6 },
		"StillEnrolledRate": { "910": 10.3, "1011": 9.6, "1112": 9.5 },
		"GEDRate": { "910": 0.4, "1011": 0.2, "1112": 0.2 } 
	},
	"All_6": { 
		"CohortGraduationRate": {"910": 60.54, "1011": 62.84, "1112": 65.98 },
		"CohortDropoutRate": { "910": 26.7, "1011": 25.3, "1112": 22.1 },
		"SpecialEdCompletersRate": { "910": 0.7, "1011": 0.8, "1112": 0.9 },
		"StillEnrolledRate": { "910": 11.5, "1011": 10.7, "1112": 10.7 },
		"GEDRate": { "910": 0.5, "1011": 0.3, "1112": 0.3 } 
	},
	"All_7": { 
		"CohortGraduationRate": {"910": 83.52, "1011": 85.65, "1112": 86.6 },
		"CohortDropoutRate": { "910": 10.7, "1011": 8.9, "1112": 8.2 },
		"SpecialEdCompletersRate": { "910": 0.4, "1011": 0.5, "1112": 0.5 },
		"StillEnrolledRate": { "910": 4.9, "1011": 4.7, "1112": 4.4 },
		"GEDRate": { "910": 0.4, "1011": 0.3, "1112": 0.3 } 
	},
	"All_9": { 
		"CohortGraduationRate": {"910": 82.8, "1011": 81.85, "1112": 83.96 },
		"CohortDropoutRate": { "910": 10.2, "1011": 11.1, "1112": 9.5 },
		"SpecialEdCompletersRate": { "910": 0.3, "1011": 0.4, "1112": 0.5 },
		"StillEnrolledRate": { "910": 6.4, "1011": 6.1, "1112": 5.7 },
		"GEDRate": { "910": 0.3, "1011": 0.5, "1112": 0.4 } 
	},
	"FEM_All": { 
		"CohortGraduationRate": {"910": 78.8, "1011": 81.3, "1112": 83.03 },
		"CohortDropoutRate": { "910": 14.1, "1011": 12.1, "1112": 10.5 },
		"SpecialEdCompletersRate": { "910": 0.3, "1011": 0.4, "1112": 0.4 },
		"StillEnrolledRate": { "910": 6.6, "1011": 6.1, "1112": 6 },
		"GEDRate": { "910": 0.2, "1011": 0.2, "1112": 0.1 } 
	},
	"FEM_0": { 
		"CohortGraduationRate": {"910": 58.07, "1011": 55.88, "1112": 56.3 },
		"CohortDropoutRate": { "910": 38.2, "1011": 37.6, "1112": 35.4 },
		"SpecialEdCompletersRate": { "910": 0.3, "1011": 0.2, "1112": 0.2 },
		"StillEnrolledRate": { "910": 3, "1011": 6.1, "1112": 7.9 },
		"GEDRate": { "910": 0.5, "1011": 0.2, "1112": 0.2 } 
	},
	"FEM_1": { 
		"CohortGraduationRate": {"910": 71.02, "1011": 72.8, "1112": 77.22 },
		"CohortDropoutRate": { "910": 19.1, "1011": 18.4, "1112": 15.8 },
		"SpecialEdCompletersRate": { "910": 0.7, "1011": 0.5, "1112": 0.5 },
		"StillEnrolledRate": { "910": 8.9, "1011": 8, "1112": 6.2 },
		"GEDRate": { "910": 0.3, "1011": 0.4, "1112": 0.2 } 
	},
	"FEM_2": { 
		"CohortGraduationRate": {"910": 90.82, "1011": 92.37, "1112": 92.72 },
		"CohortDropoutRate": { "910": 6.2, "1011": 4.7, "1112": 4.6 },
		"SpecialEdCompletersRate": { "910": 0.1, "1011": 0.2, "1112": 0.2 },
		"StillEnrolledRate": { "910": 2.7, "1011": 2.6, "1112": 2.4 },
		"GEDRate": { "910": 0.1, "1011": 0.1, "1112": 0.1 } 
	},
	"FEM_3": { 
		"CohortGraduationRate": {"910": 75.97, "1011": 79.71, "1112": 80.81 },
		"CohortDropoutRate": { "910": 18, "1011": 14.3, "1112": 12.5 },
		"SpecialEdCompletersRate": { "910": 0.4, "1011": 0.1, "1112": 0.4 },
		"StillEnrolledRate": { "910": 5.6, "1011": 5.8, "1112": 5.9 },
		"GEDRate": { "910": 0.1, "1011": 0.1, "1112": 0.4 } 
	},
	"FEM_4": { 
		"CohortGraduationRate": {"910": 90.48, "1011": 92.18, "1112": 93.44 },
		"CohortDropoutRate": { "910": 6.1, "1011": 5.1, "1112": 4.1 },
		"SpecialEdCompletersRate": { "910": 0.2, "1011": 0.3, "1112": 0.3 },
		"StillEnrolledRate": { "910": 3, "1011": 2.4, "1112": 2.2 },
		"GEDRate": { "910": 0.1, "1011": 0.1, "1112": 0.1 } 
	},
	"FEM_5": { 
		"CohortGraduationRate": {"910": 73.11, "1011": 76.35, "1112": 78.75 },
		"CohortDropoutRate": { "910": 17.5, "1011": 15.2, "1112": 12.8 },
		"SpecialEdCompletersRate": { "910": 0.4, "1011": 0.4, "1112": 0.4 },
		"StillEnrolledRate": { "910": 8.8, "1011": 8, "1112": 7.9 },
		"GEDRate": { "910": 0.2, "1011": 0.1, "1112": 0.1 } 
	},
	"FEM_6": { 
		"CohortGraduationRate": {"910": 66.63, "1011": 69.1, "1112": 72.04 },
		"CohortDropoutRate": { "910": 23.2, "1011": 21.6, "1112": 18.4 },
		"SpecialEdCompletersRate": { "910": 0.5, "1011": 0.5, "1112": 0.7 },
		"StillEnrolledRate": { "910": 9.4, "1011": 8.6, "1112": 8.7 },
		"GEDRate": { "910": 0.3, "1011": 0.3, "1112": 0.2 } 
	},
	"FEM_7": { 
		"CohortGraduationRate": {"910": 86.51, "1011": 88.78, "1112": 89.75 },
		"CohortDropoutRate": { "910": 8.9, "1011": 7.1, "1112": 6.3 },
		"SpecialEdCompletersRate": { "910": 0.3, "1011": 0.3, "1112": 0.4 },
		"StillEnrolledRate": { "910": 4, "1011": 3.6, "1112": 3.5 },
		"GEDRate": { "910": 0.3, "1011": 0.2, "1112": 0.1 } 
	},
	"FEM_9": { 
		"CohortGraduationRate": {"910": 85.41, "1011": 85.85, "1112": 87.52 },
		"CohortDropoutRate": { "910": 8.3, "1011": 9, "1112": 7.2 },
		"SpecialEdCompletersRate": { "910": 0.1, "1011": 0.4, "1112": 0.4 },
		"StillEnrolledRate": { "910": 5.9, "1011": 4.5, "1112": 4.6 },
		"GEDRate": { "910": 0.3, "1011": 0.3, "1112": 0.3 } 
	},
	"MAL_All": { 
		"CohortGraduationRate": {"910": 70.84, "1011": 73.18, "1112": 74.9 },
		"CohortDropoutRate": { "910": 19, "1011": 17.2, "1112": 15.5 },
		"SpecialEdCompletersRate": { "910": 0.5, "1011": 0.6, "1112": 0.7 },
		"StillEnrolledRate": { "910": 9.1, "1011": 8.7, "1112": 8.5 },
		"GEDRate": { "910": 0.5, "1011": 0.3, "1112": 0.3 } 
	},
	"MAL_0": { 
		"CohortGraduationRate": {"910": 49.82, "1011": 44.38, "1112": 46.42 },
		"CohortDropoutRate": { "910": 44.8, "1011": 45.6, "1112": 39 },
		"SpecialEdCompletersRate": { "910": 0.4, "1011": 0.4, "1112": 0.5 },
		"StillEnrolledRate": { "910": 4.7, "1011": 9.3, "1112": 13.7 },
		"GEDRate": { "910": 0.3, "1011": 0.4, "1112": 0.3 } 
	},
	"MAL_1": { 
		"CohortGraduationRate": {"910": 63.38, "1011": 64.31, "1112": 67.48 },
		"CohortDropoutRate": { "910": 25.3, "1011": 24.3, "1112": 21 },
		"SpecialEdCompletersRate": { "910": 0.8, "1011": 0.8, "1112": 0.6 },
		"StillEnrolledRate": { "910": 9.9, "1011": 10.2, "1112": 10.2 },
		"GEDRate": { "910": 0.6, "1011": 0.4, "1112": 0.6 } 
	},
	"MAL_2": { 
		"CohortGraduationRate": {"910": 87.3, "1011": 88.43, "1112": 89.5 },
		"CohortDropoutRate": { "910": 8.1, "1011": 7.2, "1112": 6.3 },
		"SpecialEdCompletersRate": { "910": 0.3, "1011": 0.4, "1112": 0.4 },
		"StillEnrolledRate": { "910": 4.1, "1011": 3.8, "1112": 3.6 },
		"GEDRate": { "910": 0.2, "1011": 0.2, "1112": 0.1 } 
	},
	"MAL_3": { 
		"CohortGraduationRate": {"910": 68.75, "1011": 70.33, "1112": 73.24 },
		"CohortDropoutRate": { "910": 21.2, "1011": 21, "1112": 18.2 },
		"SpecialEdCompletersRate": { "910": 0.5, "1011": 0.4, "1112": 0.9 }
		,"StillEnrolledRate": { "910": 8.7, "1011": 8.1, "1112": 7.4 },
		"GEDRate": { "910": 1, "1011": 0.2, "1112": 0.3 } 
	},
	"MAL_4": {
		"CohortGraduationRate": {"910": 84.36, "1011": 87.71, "1112": 88.33 },
		"CohortDropoutRate": { "910": 9.5, "1011": 7.6, "1112": 6.4 },
		"SpecialEdCompletersRate": { "910": 0.5, "1011": 0.5, "1112": 0.7 },
		"StillEnrolledRate": { "910": 5.5, "1011": 4, "1112": 4.4 },
		"GEDRate": { "910": 0.2, "1011": 0.1, "1112": 0.2 } 
	},
	"MAL_5": { 
		"CohortGraduationRate": {"910": 63.22, "1011": 66.59, "1112": 68.81 },
		"CohortDropoutRate": { "910": 24, "1011": 21.4, "1112": 19.2 },
		"SpecialEdCompletersRate": { "910": 0.5, "1011": 0.5, "1112": 0.7 },
		"StillEnrolledRate": { "910": 11.8, "1011": 11.1, "1112": 11 },
		"GEDRate": { "910": 0.5, "1011": 0.3, "1112": 0.3 } 
	},
	"MAL_6": { 
		"CohortGraduationRate": {"910": 54.71, "1011": 56.9, "1112": 60.27 },
		"CohortDropoutRate": { "910": 30.1, "1011": 28.9, "1112": 25.6 },
		"SpecialEdCompletersRate": { "910": 1, "1011": 1.1, "1112": 1.1 },
		"StillEnrolledRate": { "910": 13.6, "1011": 12.7, "1112": 12.6 },
		"GEDRate": { "910": 0.6, "1011": 0.4, "1112": 0.4 } 
	},
	"MAL_7": { 
		"CohortGraduationRate": {"910": 80.71, "1011": 82.71, "1112": 83.63 },
		"CohortDropoutRate": { "910": 12.4, "1011": 10.7, "1112": 10.1 },
		"SpecialEdCompletersRate": { "910": 0.5, "1011": 0.6, "1112": 0.6 },
		"StillEnrolledRate": { "910": 5.8, "1011": 5.7, "1112": 5.3 },
		"GEDRate": { "910": 0.5, "1011": 0.4, "1112": 0.4 } 
	},
	"MAL_9": { 
		"CohortGraduationRate": {"910": 80.19, "1011": 77.69, "1112": 80.39 },
		"CohortDropoutRate": { "910": 12, "1011": 13.2, "1112": 11.7 },
		"SpecialEdCompletersRate": { "910": 0.4, "1011": 0.5, "1112": 0.7 },
		"StillEnrolledRate": { "910": 7, "1011": 7.8, "1112": 6.7 },
		"GEDRate": { "910": 0.4, "1011": 0.8, "1112": 0.5 } 
	},
	"EL_All": { 
		"CohortGraduationRate": {"910": 56.39, "1011": 61.46, "1112": 62 },
		"CohortDropoutRate": { "910": 29, "1011": 24.8, "1112": 23.5 },
		"SpecialEdCompletersRate": { "910": 0.7, "1011": 0.7, "1112": 1 },
		"StillEnrolledRate": { "910": 13.6, "1011": 12.8, "1112": 12.2 },
		"GEDRate": { "910": 0.3, "1011": 0.2, "1112": 0.2 }
	},
	"MIG_All": { 
		"CohortGraduationRate": {"910": 71.14, "1011": 73.03, "1112": 74.76 },
		"CohortDropoutRate": { "910": 18.8, "1011": 17.4, "1112": 16 },
		"SpecialEdCompletersRate": { "910": 0.6, "1011": 0.5, "1112": 0.6 },
		"StillEnrolledRate": { "910": 9.2, "1011": 8.7, "1112": 8.4 },
		"GEDRate": { "910": 0.3, "1011": 0.3, "1112": 0.2 } 
	},
	"SD_All": {
		"CohortGraduationRate": {"910": 68.04, "1011": 71.07, "1112": 73.04 },
		"CohortDropoutRate": { "910": 20.1, "1011": 18.1, "1112": 16.3 },
		"SpecialEdCompletersRate": { "910": 0.5, "1011": 0.5, "1112": 0.6 },
		"StillEnrolledRate": { "910": 10.9, "1011": 9.9, "1112": 9.8 },
		"GEDRate": { "910": 0.4, "1011": 0.3, "1112": 0.3 }
	},
	"SE_All": {
		"CohortGraduationRate": {"910": 56.72, "1011": 59.52, "1112": 61.13 },
		"CohortDropoutRate": { "910": 21.9, "1011": 19, "1112": 17 },
		"SpecialEdCompletersRate": { "910": 3.5, "1011": 3.9, "1112": 4.7 },
		"StillEnrolledRate": { "910": 17.5, "1011": 17.4, "1112": 16.9 },
		"GEDRate": { "910": 0.4, "1011": 0.3, "1112": 0.2 } 
	}
}
				
				
var gridItems;

var dataTooltipText = {
	"CohortGraduationRate":'<div><span class="dataHeader">Cohort Graduation Rates</span><br>The four-year graduation rate is calculated by dividing the number of students in the 4-year adjusted cohort who graduate in four years or less with either a traditional high school diploma, an adult education high school diploma, or have passed the California High School Proficiency Exam (CHSPE) by the number of students who form the adjusted cohort for that graduating class.<br><br><span class="dataSubHeader">Calculation:</span>  number of cohort members who earned a regular high school diploma by the end of year 4 in the cohort <span class="dataDivision">divided by</span> the number of first-time grade 9 students in year 1 (starting cohort) plus students who transfer in, minus students who transfer out, emigrate, or die during school years 1, 2, 3, and 4.</div>',
	"CohortDropoutRate":'<div><span class="dataHeader">Cohort Dropout Rate</span><br>The rate of students that leave the 9-12 instructional system without a high school diploma, GED, or special education certificate of completion and do not remain enrolled after the end of the 4th year. <br><br><span class="dataSubHeader">Calculation:</span>  number of students in the 4-year cohort that dropped out by the end of year 4 of the cohort <span class="dataDivision">divided by</span> the number of first-time grade 9 students in year 1 (starting cohort) plus students who transfer in, minus students who transfer out, emigrate, or die during school years 1, 2, 3, and 4.</div>',
	"StillEnrolledRate":'<div class="dataTooltipContainer"><span class="dataHeader">Still Enrolled Rate</span><br>This is the rate of students that remain enrolled in the 9-12 instructional system without a high school diploma after the end of the 4th year of high school.<br><br><span class="dataSubHeader">Calculation:</span>  number of students that were enrolled after the end of the 4th year <span class="dataDivision">divided by</span> the number of first-time grade 9 students in year 1 (starting cohort) plus students who transfer in, minus students who transfer out, emigrate, or die during school years 1, 2, 3, and 4.</div>',
	"SpecialEdCompletersRate":'<div><span class="dataHeader">Special Education Completers Rate</span><br>The rate of special education students that leave the 9-12 instructional system without a high school diploma, but have completed requirements necessary to obtain a special education certificate of completion. <br><br><span class="dataSubHeader">Calculation:</span>  number of students in the cohort that received his/her special education certificate of completion by the end of year 4 of the cohort <span class="dataDivision">divided by</span> the number of first-time grade 9 students in year 1 (starting cohort) plus students who transfer in, minus students who transfer out, emigrate, or die during school years 1, 2, 3, and 4.</div>',
	"GEDRate":'<div><span class="dataHeader">GED Rate</span><br>The rate of students that leave the 9-12 instructional system without a high school diploma, but have passed the GED test.<br><br><span class="dataSubHeader">Calculation:</span>  number of students in the 4-year cohort that passed the GED test by the end of year 4 of the cohort <span class="dataDivision">divided by</span> the number of first-time grade 9 students in year 1 (starting cohort) plus students who transfer in, minus students who transfer out, emigrate, or die during school years 1, 2, 3, and 4.</div>'
};

var countyIdDistrictIdSpatialJoin = {
"1" :  [26,27,28,29,30,31,32,33,34,35,36,37,349,350,348],
"2" :  [7,337,338,138],
"3" :  [3,5,6,4,139,140],
"4" :  [8,9,418],
"5" :  [20,21,22,23,24,25,333,346,347,123,147,267,345],
"6" :  [15,17,342,16,163,341,343,400],
"7" :  [18],
"8" :  [19,344],
"9" :  [10,11,12,13,14,339,340,196],
"10" :  [44,357,45,242,354,355,356],
"11" :  [38,39,40,41,42,43,352,353,107,154,351,385],
"12" :  [53,56,57,58,59,361,362,363,54,55,364,419],
"13" :  [46,47,48,49,50,358,359,360,181,182,226,370],
"14" :  [51,52,4,204,279,284,286],
"15" :  [64,65,66,67,68,69,70,71,72,273,351],
"16" :  [73,74,75,76,77,78,367,16,286,341,343,395],
"17" :  [60,61,62,63,365,366,121,388],
"18" :  [368,233],
"19" :  [79,80,81,82,83,84,369,371,372,436,117,122,278,370,389,390,426,427],
"20" :  [86,87,88,89,90,91,92,93,94,95,96,97,373,374,375,376,377,378],
"21" :  [85,235],
"22" :  [105,379,123,267,345],
"23" :  [106,380,381,133,354],
"24" :  [98,99,100,101,102,103,104,382,383,384,55,268],
"25" :  [109,388],
"26" :  [111,112,113,114,115,118,119,120,124,125,126,129,437,116,117,121,122,123,127,128,389,390],
"27" :  [110],
"28" :  [108,386,387,107,385],
"29" :  [137,334,138,139,140],
"30" :  [130,135,391,131,132,133,134],
"31" :  [136],
"32" :  [151,152,153,154],
"33" :  [141,142,143,144,145,146,147],
"34" :  [148,392,394,149,150,393],
"35" :  [396,163],
"36" :  [155,156,157,158,159,160,161,162,395],
"37" :  [164,165,166,167,168,170,171,172,173,174,176,177,178,179,398,169,175,180,181,182,183,195,259,397],
"38" :  [203,205,401,204,400],
"39" :  [184,185,186,187,188,189,190,191,192,193,194,197,198,199,200,201,202,399,183,195,196],
"40" :  [206,207,402,403,404,405,406,407,408,208,209],
"41" :  [210,211,212,213,214,215,216,409,410,217],
"42" :  [234,414,415],
"43" :  [228,229,230,231,232,413,233],
"44" :  [235],
"45" :  [238,239,240,241,417],
"46" :  [131,132,133,134,242],
"47" :  [236,237,416,163],
"48" :  [243,244,245,246,247,248,249,251,252,253,254,255,256,257,258,217,250],
"49" :  [261,259,260,262,263,418],
"50" :  [264],
"51" :  [265,266,420,421,267,419],
"52" :  [277,428,116,127,278,389,426,427],
"53" :  [274,275,276,424,425,208,209,273],
"54" :  [280,281,282,283,285,153,279,284,286],
"55" :  [269,270,271,272,422,423,128,268],
"56" :  [1,2,335,336,435,227],
"57" :  [219,220,221,222,223,224,411,412,218,225,226,227],
"58" :  [287,288,289,290,291,292,293,294,295,296,297,298,299,300,301,302,303,306,307,308,309,310,311,312,313,314,315,316,317,318,319,320,321,322,323,324,325,326,327,328,329,330,331,332,429,430,431,432,433,434,180,225,304,305,348]
}

function init(){
	esri.config.defaults.io.proxyUrl = "/proxy/proxy.ashx"
	
	dojo.byId("layer").value = "counties";
	dojo.byId("category").value = "CohortGraduationRate";
	dojo.byId('subtype').value = "All";
	dojo.byId('subgroup').value = "All";
	
	var tip = new dijit.Tooltip({
		label: '<div class="myTipType">Change the map color scheme.</div>',
		showDelay: 50,
		connectId: ["colorToolDiv"],
		position: ["below", "above", "before", "after"]
	});
	
	var tip2 = new dijit.Tooltip({
		label: '<div class="myTipType">Show/hide the histogram.</div>',
		showDelay: 50,
		connectId: ["chartToolDiv"],
		position: ["below", "above", "before", "after"]
	});	
	
	var tip3 = new dijit.Tooltip({
		label: '<div class="myTipType">Double-click to toggle the task dialog. Click + drag to move the dialog to a new position.</div>',
		showDelay: 50,
		connectId: ["toggleSearch", "toggleSearchImage"],
		position: ["before", "above", "after"]
	});
	
	var tip4 = new dijit.Tooltip({
		label: '<div class="myTipType">Reset the map.</div>',
		showDelay: 50,
		connectId: ["zoomFullToolDiv"],
		position: ["below", "above", "before", "after"]
	});	
	
	var tip5 = new dijit.Tooltip({
		label: '<div class="myTipType">Display current records in a table.</div>',
		showDelay: 50,
		connectId: ["tableToolDiv"],
		position: ["below", "above", "before", "after"]
	});
	
	var tip5 = new dijit.Tooltip({
		label: '<div class="myTipType">Change the underlying basemap.</div>',
		showDelay: 50,
		connectId: ["baseMapSelector"],
		position: ["before", "below", "above", "after"]
	});

	var tip2 = new dijit.Tooltip({
		label: '<div class="myTipType">Show/hide the legend.</div>',
		showDelay: 50,
		connectId: ["legendToolDiv"],
		position: ["below", "above", "before", "after"]
	});		
	
	dataTooltip = new dijit.Tooltip({
		label: dataTooltipText["CohortGraduationRate"],
		showDelay: 50,
		connectId: ["dataHelp"]
	});

	new dijit.Tooltip({ id:"legend_tooltip", connectId: "legendContentDiv", label: "Legend of map features based on the custom search. Click + drag to move the dialog to a new position.", showDelay:50 });
	new dijit.Tooltip({ id:"chart_tooltip", connectId: "chartContentDiv", label: "Histogram of records based on the custom search. Click + drag to move the dialog to a new position.", showDelay:50 });
	new dijit.Tooltip({ id:"grid_tooltip", connectId: "gridHandle", label: "Table of records based on the custom search. Click + drag to move the dialog to a new position.", showDelay:50 })

	dojo.style("mapProgressBar", { 
			display:"block",
			top: dojo.style("mapDiv", "height")/2 - dojo.style("mapProgressBar", "height")/2 + dojo.style("topDiv", "height")/2 + "px",
			left: dojo.style("mapDiv", "width")/2 - dojo.style("mapProgressBar", "width")/2 + "px"
	});	

	var initExtent = new esri.geometry.Extent({
	"xmin": -13849152,
	"ymin": 3767250,
	"xmax": -12705090,
	"ymax": 5228832,
	"spatialReference": {
	  "wkid": 102100
	}
	});
	
	var lods = [
      {"level" : 0, "resolution" : 2445.98490512499, "scale" : 9244648.868618}, 
      {"level" : 1, "resolution" : 1222.99245256249, "scale" : 4622324.434309}, 
      {"level" : 2, "resolution" : 611.49622628138, "scale" : 2311162.217155}, 
      {"level" : 3, "resolution" : 305.748113140558, "scale" : 1155581.108577}, 
      {"level" : 4, "resolution" : 152.874056570411, "scale" : 577790.554289},
	  {"level" : 5, "resolution" : 76.43702828507324, "scale" : 288895.277144},
	  {"level" : 6, "resolution" : 38.21851414253662, "scale" : 144447.638572},
	  {"level" : 7, "resolution" : 19.10925707126831, "scale" : 72223.819286}
    ];
	
	map = new esri.Map("mapDiv", {
		extent: initExtent,
		lods: lods,
		fadeOnZoom: true,
		fitExtent: true,
		slider: false,
		logo: false,
		navigationMode:'css-transforms'
	});	
	
	dojo.connect(map, 'onLoad', function(map) {
		//console.log('slider')
		dojo.connect(dijit.byId('mapDiv'), 'resize', function(){
				map.resize();
				map.reposition();
		});
		initSlider();
		
		gsvc = new esri.tasks.GeometryService(geometryUrl);
		
		var polySymbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([150,150,150,0.25]),1), new dojo.Color([121,128,105,0])); 
		countiesFeatureLayer = new esri.layers.FeatureLayer("http://arcgis.cisr.ucsc.edu/arcgis/rest/services/CDRP/CDRP_2012/MapServer/2", {
			  mode: esri.layers.FeatureLayer.MODE_SNAPSHOT,
			  outFields: ["NAME", "ID"],
			  maxAllowableOffset: calcOffset()
			});
		countiesFeatureLayer.setRenderer(new esri.renderer.SimpleRenderer(polySymbol));
		
		districtsFeatureLayer = new esri.layers.FeatureLayer("http://arcgis.cisr.ucsc.edu/arcgis/rest/services/CDRP/CDRP_2012/MapServer/1", {
			  mode: esri.layers.FeatureLayer.MODE_SNAPSHOT,
			  outFields: ["NAME", "ID"],
			  maxAllowableOffset: calcOffset()
			});
		districtsFeatureLayer.setRenderer(new esri.renderer.SimpleRenderer(polySymbol));
		districtsFeatureLayer.setDefinitionExpression(yearField + " = 1");
		
		secondaryFeatureLayer = new esri.layers.FeatureLayer("http://arcgis.cisr.ucsc.edu/arcgis/rest/services/CDRP/CDRP_2012/MapServer/1", {
			  mode: esri.layers.FeatureLayer.MODE_SNAPSHOT,
			  outFields: ["NAME", "ID"],
			  maxAllowableOffset: calcOffset()

			});
		secondaryFeatureLayer.setRenderer(new esri.renderer.SimpleRenderer(polySymbol));
		secondaryFeatureLayer.setDefinitionExpression("DISTRTYPE = 'Secondary' AND " + yearField + " = 1");
		
		unifiedFeatureLayer = new esri.layers.FeatureLayer("http://arcgis.cisr.ucsc.edu/arcgis/rest/services/CDRP/CDRP_2012/MapServer/1", {
			  mode: esri.layers.FeatureLayer.MODE_SNAPSHOT,
			  outFields: ["NAME", "ID"],
			  maxAllowableOffset: calcOffset()

			});
		unifiedFeatureLayer.setRenderer(new esri.renderer.SimpleRenderer(polySymbol));
		unifiedFeatureLayer.setDefinitionExpression("DISTRTYPE = 'Unified' AND " + yearField + " = 1");
		
		var ptSymbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 6, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([150,150,150,0]), 1), new dojo.Color([121,128,105,0]));
		schoolFeatureLayer = new esri.layers.FeatureLayer("http://arcgis.cisr.ucsc.edu/arcgis/rest/services/CDRP/CDRP_2012/MapServer/0", {
			  mode: esri.layers.FeatureLayer.MODE_SNAPSHOT,
			  outFields: ["NAME", "ID"]
			});
		schoolFeatureLayer.setRenderer(new esri.renderer.SimpleRenderer(ptSymbol));
		
		symbologyLayer = new esri.layers.GraphicsLayer({id:'symbologyLayer'});
		
		highlightLayer = new esri.layers.GraphicsLayer({id:'highlightLayer'});
		
		dojo.connect(map, "onLayersAddResult", function(){
			activeFeatureLayer = countiesFeatureLayer;
			districtsFeatureLayer.hide();
			secondaryFeatureLayer.hide();
			unifiedFeatureLayer.hide();
			schoolFeatureLayer.hide();
			updateLayerSymbology();
			
			dojo.connect(countiesFeatureLayer, "onMouseOver", function(evt){
				layerMouseOver(evt, this);
			});
			dojo.connect(districtsFeatureLayer, "onMouseOver", function(evt){
				layerMouseOver(evt, this);
			});
			dojo.connect(secondaryFeatureLayer, "onMouseOver", function(evt){
				layerMouseOver(evt, this);
			});
			dojo.connect(unifiedFeatureLayer, "onMouseOver", function(evt){
				layerMouseOver(evt, this);
			});
			dojo.connect(schoolFeatureLayer, "onMouseOver", function(evt){
				layerMouseOver(evt, this);
			});
			
			dojo.connect(countiesFeatureLayer, "onUpdateEnd", function(){
				dojo.style("mapProgressBar", { "display":"none" });	
			});
			
			dojo.connect(districtsFeatureLayer, "onUpdateEnd", function(){
				dojo.style("mapProgressBar", { "display":"none" });	
			});
			
			dojo.connect(secondaryFeatureLayer, "onUpdateEnd", function(){
				dojo.style("mapProgressBar", { "display":"none" });	
			});
			
			dojo.connect(unifiedFeatureLayer, "onUpdateEnd", function(){
				dojo.style("mapProgressBar", { "display":"none" });	
			});
			
			dojo.connect(schoolFeatureLayer, "onUpdateEnd", function(){
				dojo.style("mapProgressBar", { "display":"none" });	
			});
			
			var tip = "This is a tooltip.";
			tooltip = dojo.create("div", { "class": "maptooltip", "innerHTML": tip }, map.container);
			dojo.style(tooltip, "position", "fixed");

			dojo.connect(highlightLayer, "onMouseMove", function(evt) {
				var px, py;        
				if (evt.clientX || evt.pageY) {
				  px = evt.clientX;
				  py = evt.clientY;
				} else {
				  px = evt.clientX + dojo.body().scrollLeft - dojo.body().clientLeft;
				  py = evt.clientY + dojo.body().scrollTop - dojo.body().clientTop;
				}
				
				content = '';
				var name = evt.graphic.attributes["NAME"];
				var id = evt.graphic.attributes["ID"];
				var value = values[id]
				if (value == undefined) {
					content = "<b>" + name + "</b><br>No Data";
				} else {
					content = "<b>" + name + "</b><br>" + value + "%";
				}
				tooltip.innerHTML = content;
				
				tooltip.style.display = "none";
				dojo.style(tooltip, { left: (px + 15) + "px", top: (py) + "px" });
				tooltip.style.display = "";
			});

			dojo.connect(highlightLayer, "onClick", function(evt) {
				mevt = evt;	
				var category = dojo.byId('category').value;
				var fields = dojo.clone(fieldMap[category].field);
				fields.push("Name");
				var subgroup = dojo.byId('subgroup').value;
				var subtype = dojo.byId('subtype').value;
				var name = evt.graphic.attributes["NAME"];
				var id =  evt.graphic.attributes["ID"];
				var geo = evt.graphic;
				
				var query = new esri.tasks.Query();
				query.outFields = fields;
				query.returnGeometry = false;
				
				if (dojo.byId("layer").value == "Secondary") {
					query.where = ("ID = " + id + " AND DistType = 'Secondary' AND Subgroup = '" + subgroup + "' AND Subgrouptype = '" + subtype + "' AND Year = '" + year + "'");
					var queryTask = new esri.tasks.QueryTask(districtTableUrl);
					queryTask.execute(query, function(records) {
								showRecords(records, geo);
					});
				} else if (dojo.byId("layer").value == "Unified") {
					query.where = ("ID = " + id + " AND DistType = 'Unified' AND Subgroup = '" + subgroup + "' AND Subgrouptype = '" + subtype + "' AND Year = '" + year + "'");
					var queryTask = new esri.tasks.QueryTask(districtTableUrl);
					queryTask.execute(query, function(records) {
								showRecords(records, geo);
					});	
				} else if (dojo.byId("layer").value == "districts") {
					query.where = ("ID = " + id + " AND Subgroup = '" + subgroup + "' AND Subgrouptype = '" + subtype + "' AND Year = '" + year + "'");
					var queryTask = new esri.tasks.QueryTask(districtTableUrl);
					queryTask.execute(query, function(records) {
								showRecords(records, geo);
					});	
				} else if (dojo.byId("layer").value == "counties") {
					query.where = ("ID = " + id + " AND Subgroup = '" + subgroup + "' AND Subgrouptype = '" + subtype + "' AND Year = '" + year + "'");
					var queryTask = new esri.tasks.QueryTask(countyTableUrl);
					queryTask.execute(query, function(records) {
								showRecords(records, geo);
					});	
				} else if (dojo.byId("layer").value == "schools") {
					query.where = ("ID = " + id + " AND Subgroup = '" + subgroup + "' AND Subgrouptype = '" + subtype + "' AND Year = '" + year + "'");
					var queryTask = new esri.tasks.QueryTask(schoolTableUrl);
					queryTask.execute(query, function(records) {
								showRecords(records, geo);
					});	
				}
				closeDialog();
			});	
			
			dojo.connect(highlightLayer,"onMouseOut", closeDialog);
		
		});
		
		map.addLayers([countiesFeatureLayer, districtsFeatureLayer, secondaryFeatureLayer, unifiedFeatureLayer, schoolFeatureLayer, symbologyLayer, highlightLayer]);
		
		dojo.connect(map, "onUpdateEnd", function(){
			dojo.style("mapProgressBar", { "display":"none" });
			if (schoolFeatureLayer.visible) { changePointSymbolSize() }
			
		});
		
		maxExtent = map.extent;
		dojo.connect(map, "onExtentChange", function(extent, delta, outLevelChange, outLod){
			closeDialog();
			//if (schoolFeatureLayer.visible) { changePointSymbolSize() }
		});
		
		dojo.connect(map, 'onZoomEnd', function() {
			//if (schoolFeatureLayer.visible) { changePointSymbolSize() }
		});
		
		map.infoWindow.resize(245,125);
		
		searchMoveableDiv = new dojo.dnd.move.parentConstrainedMoveable("searchContentDiv", {handle: "searchheader", area: "border", within: true});
		legendMoveableDiv = new dojo.dnd.move.parentConstrainedMoveable("legendContentDiv", {handle: "legendDiv", area: "border", within: true});
		chartMoveableDiv = new dojo.dnd.move.parentConstrainedMoveable("chartContentDiv", {handle: "chartDiv" ,area: "border", within: true});
		tableMoveableDiv = new dojo.dnd.move.parentConstrainedMoveable("gridContainer", {handle: "gridHandle" ,area: "border", within: true});
		
		dojo.style("searchheader", {"cursor":"move"});
		dojo.style("legendDiv", {"cursor":"move"});
		dojo.style("chartDiv", {"cursor":"move"});
		dojo.style("gridHandle", {"cursor":"move"});
		
		dojo.connect(dojo.byId("zoomInIncrementDiv"), "onclick", function() {
			map.setLevel(map.getLevel() + 1);
		});

		dojo.connect(dojo.byId("zoomOutIncrementDiv"), "onclick", function() {
			map.setLevel(map.getLevel() - 1);
		});	

		dojo.connect(dojo.byId("zoomFullToolDiv"), "onclick", function() {
			resetMap();
		});
		
		dojo.style("zoomToolsDiv", "display", "block");
		dojo.style("baseMapOptionDiv", "display", "block");
		dojo.style("chartToolDiv", "display", "block");
		dojo.style("legendToolDiv", "display", "block");
		dojo.style("tableToolDiv", "display", "block");
		dojo.style("colorOptionDiv", "display", "block");
		dojo.style("searchContentDiv", "display", "block");
		
		var mapHeight = dojo.getMarginBox(dojo.byId("mapDiv")).h;
		var margin = 10;
		if ((mapHeight-440) < 25) {
			dojo.style("legendContentDiv","top", "5px");
			margin = 5;
		}
		var top = dojo.style("legendContentDiv","top") + 240 + margin;
		dojo.setMarginBox(dojo.byId("chartContentDiv"), {t: top});

		
	});	
	
	streetsLayer = new esri.layers.ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer",{id:'streets'});
	streetsLayer.setOpacity(0.75);
	map.addLayer(streetsLayer);
	streetsLayer.hide();
	
	imageryLayer = new esri.layers.ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer",{id:'imagery'});	
	map.addLayer(imageryLayer);
	imageryLayer.hide();
	
	imageryLayerLabels = new esri.layers.ArcGISTiledMapServiceLayer("http://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer",{id:'grayLabels'});
	imageryLayerLabels.setOpacity(0.65);
	map.addLayer(imageryLayerLabels);
	imageryLayerLabels.hide();
	
	grayLayer = new esri.layers.ArcGISTiledMapServiceLayer("http://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer",{id:'gray'});
	map.addLayer(grayLayer);
	
	grayLayerLabels = new esri.layers.ArcGISTiledMapServiceLayer("http://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer",{id:'grayLabels'});
	grayLayerLabels.setOpacity(0.5);
	map.addLayer(grayLayerLabels);
}

function initSlider() {
	var timeSliderDiv = dojo.byId("timeSliderDiv");
	
	var rulesNode = document.createElement('div');
	timeSliderDiv.appendChild(rulesNode);
	var sliderRules = new dijit.form.HorizontalRule({
		container:"bottomDecoration",
		count:3,
		style:"height:5px; top:-10px; left:-1px;"
	}, rulesNode);
	
	var timeSlider = new dijit.form.HorizontalSlider({
		name: "timeslider",
		value: 2,
		minimum: 0,
		maximum: 2,
		discreteValues: 3,
		showButtons: false,
		style: "width:250px; height:30px;",
		onChange: function(value) {
			updateYear(value);
		   }
		},
		timeSliderDiv);
		
		if (dojo.isIE >= 9){
			dojo.style("timeSliderDiv", "margin", "10px 0px 0px 0px");
			dojo.style("timeSliderLabels", "bottom", "22px");
		}
}

function calcOffset() {
	//return (map.extent.getWidth() / map.width);
	return 50;
}

function showRecords(records, geo) {
	if (dijit.byId('boundary')) { dijit.byId('boundary').destroy(true); }
	if (dijit.byId('feature')) { dijit.byId('feature').destroy(true); }
	if (dijit.byId('districts')) { dijit.byId('districts').destroy(true); }
	if (dijit.byId('schools')) { dijit.byId('schools').destroy(true); }
	
	symbologyLayer.clear();
	var category = dojo.byId('category').value;
	var fields = fieldMap[category].field;
	var fieldAliases = fieldMap[category].alias;
	
	if (dojo.byId("layer").value == "counties") {
		var title = mevt.graphic.attributes["NAME"] + ' County';
	} else if (dojo.byId("layer").value == "schools") {
		var title = mevt.graphic.attributes["NAME"];
	} else {
		var title = mevt.graphic.attributes["NAME"];
	}	
	
	map.infoWindow.setTitle(title);
	
	var content = "";
	content += '<div style="margin-bottom:10px;padding-bottom:10px;font-variant:small-caps;border-bottom:1px solid #ccc;"> Filter: ';
	if ((dojo.byId('subgroup').value == 'All')&&(dojo.byId('subtype').value == 'All')) {  }
	if (dojo.byId('subgroup').value != 'All') { content += dojo.byId('subgroup').options[dojo.byId('subgroup').selectedIndex].text }
	if ((dojo.byId('subgroup').value != 'All')&&(dojo.byId('subtype').value != 'All')) { content += ", " }
	if (dojo.byId('subtype').value != 'All') { content += dojo.byId('subtype').options[dojo.byId('subtype').selectedIndex].text }
	if ((dojo.byId('subgroup').value == 'All')&&(dojo.byId('subtype').value == 'All')) { content += "none" }
	content += "</div>"
	
	var data = "";
	dojo.forEach(records.features, function(feature){
		dojo.forEach(fields, function(field,i) {
			var value = feature.attributes[field]
			data = value
			if (value == null) { value = "&lt;= 10" }
			content += fieldAliases[i] + ": <b>" + value
			if (field.search("Rate") != -1) { content +="%" }
			content +="</b><br>"
			
		});
	});
	if (data == "") { content += "No Data Available<br>" }
	
	if (geo.geometry.type == "polygon") {
		var extent = geo.geometry.getExtent();
	} else {
		var expand = 5000
		var extent = new esri.geometry.Extent(geo.geometry.x-expand,geo.geometry.y-expand,geo.geometry.x+expand,geo.geometry.y+expand, map.spatialReference);
	}
	var id = geo.attributes["OBJECTID"];
	content += "<div id=\"zoomHeader\"><a href=\"javascript:zoomToFeature([" + extent.xmin + "," + extent.ymin + "," + extent.xmax + "," + extent.ymax + "], " + id + ")\">Zoom to feature >></a></div>";
	
	if (dojo.byId("layer").value == "counties") {
		content += "<div id=\"zoomTaskDiv\">";
		content += "<div id=\"zoom\"> <span style=\"font-variant:small-caps;font-size:8pt;\"> show: </span>";
		content += "<input type=\"radio\" id=\"feature\" name=\"zoom\"> <label for=\"feature\" class=\"zoomRadioLabel\">feature...</label>";
		content += "<input type=\"radio\" id=\"districts\" name=\"zoom\"> <label for=\"districts\" class=\"zoomRadioLabel\">districts in...</label>";
		content += "<input type=\"radio\" id=\"schools\" name=\"zoom\"> <label for=\"schools\" class=\"zoomRadioLabel\">schools in...</label>";
		content += "</div>";
		var width = 325;
	} else if ((dojo.byId("layer").value == "districts") || (dojo.byId("layer").value == "Unified") || (dojo.byId("layer").value == "Secondary") ) {
		content += "<div id=\"zoomTaskDiv\">";
		content += "<div id=\"zoom\"> <span style=\"font-variant:small-caps;font-size:8pt;\"> show: </span>";
		content += "<input type=\"radio\" id=\"feature\" name=\"zoom\"> <label for=\"feature\" class=\"zoomRadioLabel\">feature...</label>";
		content += "<input type=\"radio\" id=\"schools\" name=\"zoom\"> <label for=\"schools\" class=\"zoomRadioLabel\">schools in...</label>";
		content += "</div>";
		var width = 280;
	} else {
		content += "<div id=\"zoomTaskDiv\" style=\"display:none;\">";
		content += "<div id=\"zoom\">show: ";
		content += "<input type=\"radio\" id=\"feature\" name=\"zoom\"> <label for=\"feature\" class=\"zoomRadioLabel\">feature...</label>";
		content += "</div>";
		var width = 280;
	}
	content += "</div>";
	
	map.infoWindow.resize(width, 170);
	map.infoWindow.setContent(content);
	if (dojo.byId('feature')) { var radio = new dijit.form.RadioButton({ id: "feature", checked: true, value:"feature", name:"zoom" }, "feature") };
	if (dojo.byId('districts')) { var radio = new dijit.form.RadioButton({ id: "districts", checked: false, value:"districts", name:"zoom" }, "districts"); }
	if (dojo.byId('schools')) { var radio = new dijit.form.RadioButton({ id: "schools", checked: false, value:"schools", name:"zoom" }, "schools"); }
	
	map.infoWindow.show(mevt.screenPoint, map.getInfoWindowAnchor(mevt.screenPoint));
	mevt = null;

}

function zoomToFeature(geo, id){
	var extent = new esri.geometry.Extent({ "xmin": geo[0], "ymin": geo[1], "xmax": geo[2], "ymax": geo[3], "spatialReference": { "wkid": 102100 } });
	map.setExtent(extent.expand(1.5));
	
	var layer = dojo.query('#zoom input:checked')[0].value;
	
	closeDialog();
	map.infoWindow.hide();
	
	if (layer != 'feature') {
		var feature = dojo.filter(activeFeatureLayer.graphics, function(graphic){
			return graphic.attributes["OBJECTID"] == id;
		})[0];
		
		var polyline = new esri.geometry.Polyline(map.spatialReference);
		dojo.forEach(feature.geometry.rings, function(ring){
			polyline.addPath(ring);
		});
		var symbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DOT, new dojo.Color([30,30,30]), 2);
		var shape = new esri.Graphic(polyline, symbol,{ "NAME": feature.attributes["NAME"] });
		symbologyLayer.add(shape);
		
		if (layer == "schools") {
			var query = new esri.tasks.Query();
			query.returnGeometry = false;
			query.geometry = feature.geometry;
			query.outFields = ["OBJECTID"];
			query.spatialRelationship = esri.tasks.Query.SPATIAL_REL_CONTAINS;
			var queryTask = new esri.tasks.QueryTask(schoolFeatureLayer.url);
			queryTask.execute(query, function(results) 	{
				var ids = dojo.map(results.features, function(feature){
					return feature.attributes["OBJECTID"];
				});
				dojo.forEach(schoolFeatureLayer.graphics, function(graphic){
					if (dojo.indexOf(ids, graphic.attributes["OBJECTID"]) == -1) {
						graphic.visible = false;
					}
				});
				schoolFeatureLayer.redraw();
			});
		} else if (layer = "districts") {
			var ids = countyIdDistrictIdSpatialJoin[id];
			dojo.forEach(districtsFeatureLayer.graphics, function(graphic){
				if (dojo.indexOf(ids, graphic.attributes["OBJECTID"]) == -1) {
					graphic.visible = false;
				}
			});
			districtsFeatureLayer.redraw();
		}

		mapExtentChange = dojo.connect(map, "onExtentChange", function(extent,delta,levelChange,lod){
			changeLayersOnExtentChange(lod.level, layer)
		});
	}
}

function changeLayersOnExtentChange(level, layer){
	dojo.byId("layer").value = layer;
	updateSubgroupOptions();
	changeActiveFeatureLayer(layer);
	hideAllFeatureLayers();	
	updateLayerSymbology();
	dojo.disconnect(mapExtentChange);
}

function updateYear(value) {
	dojo.style("mapProgressBar", { "display":"block" });
	year = years[value];
	yearField = 'Data_' + year;
	updateLayerSymbology();
}

function changeActiveFeatureLayer(layer) {
	if (layer == "Secondary"){
		activeFeatureLayer = secondaryFeatureLayer;
	} else if (layer == "Unified") {
		activeFeatureLayer = unifiedFeatureLayer;
	} else if (layer == "districts") {
		activeFeatureLayer = districtsFeatureLayer;
	} else if (layer == "counties") {
		activeFeatureLayer = countiesFeatureLayer;
	} else if (layer == "schools") {
		activeFeatureLayer = schoolFeatureLayer;
	}
}

function hideAllFeatureLayers() {
	countiesFeatureLayer.hide();
	districtsFeatureLayer.hide();
	unifiedFeatureLayer.hide();
	secondaryFeatureLayer.hide();
	schoolFeatureLayer.hide();
}

function resetLayerFeaturesVisibility(){
	dojo.forEach(districtsFeatureLayer.graphics, function(graphic){
		graphic.visible = true;
	});
	
	dojo.forEach(schoolFeatureLayer.graphics, function(graphic){
		graphic.visible = true;
	});
}

function updateLayerVisibility(value) {
	hideAllFeatureLayers();	
	resetLayerFeaturesVisibility();
	changeActiveFeatureLayer(value);
	updateLayerSymbology();
	symbologyLayer.clear();
	closeDialog();
	map.infoWindow.hide();
}

function updateSubgroupOptions(){
	var sb = dojo.byId('subgroup')
	var selected = sb.value
	if (dojo.byId('layer').value == 'counties') {
		sb.options.length = 0
		sb.options[0] = new Option("All","All",true, true)
		sb.options[1] = new Option("Female","FEM",false, false)
		sb.options[2] = new Option("Male","MAL",false, false)
		sb.options[3] = new Option("English Learners","EL",false, false)
		sb.options[4] = new Option("Migrant Education","MIG",false, false)
		sb.options[5] = new Option("Socioeconomically Disadvantaged","SD",false, false)
		sb.options[6] = new Option("Special Education","SE",false, false)
		sb.value = selected
	} else {
		sb.options.length = 0
		sb.options[0] = new Option("All","All",true, true)
		sb.options[1] = new Option("English Learners","EL",false, false)
		sb.options[2] = new Option("Migrant Education","MIG",false, false)
		sb.options[3] = new Option("Socioeconomically Disadvantaged","SD",false, false)
		sb.options[4] = new Option("Special Education","SE",false, false)
		if ((selected == "MAL") || (selected == "FEM")) {
			sb.value = "All"
		} else {
			sb.value = selected
		}
	}
}

function updateSubtypeOptions() {
	var sb = dojo.byId('subgroup')
	var st = dojo.byId('subtype')
	if ((sb.value == 'All') || (sb.value == 'FEM') || (sb.value == 'MAL')) {
		st.disabled = false
	} else {
		st.value = "All"
		st.disabled = true
	}

}

function updateLayerSymbology() {
	dojo.style("mapProgressBar", { "display":"block" });
	dojo.byId('subgroup').disabled = false;
	updateSubtypeOptions();
	
	var field = dojo.byId('category').value;
	var subgroup = dojo.byId('subgroup').value;
	var subtype = dojo.byId('subtype').value;
	
	var query = new esri.tasks.Query();
	query.outFields = ["ID", "Name", field];
	query.returnGeometry = false;
	
	if (dojo.byId("layer").value == "Secondary") {
		query.where = ("DistType = 'Secondary' AND Subgroup = '" + subgroup + "' AND Subgrouptype = '" + subtype + "' AND Year = '" + year + "'");
		var queryTask = new esri.tasks.QueryTask(districtTableUrl);
		queryTask.execute(query, function(records) {
					showLayerSymbology(records,field)
		});	
	} else if (dojo.byId("layer").value == "Unified") {
		query.where = ("DistType = 'Unified' AND Subgroup = '" + subgroup + "' AND Subgrouptype = '" + subtype + "' AND Year = '" + year + "'");
		var queryTask = new esri.tasks.QueryTask(districtTableUrl);
		queryTask.execute(query, function(records) {
					showLayerSymbology(records,field)
		});	
	} else if (dojo.byId("layer").value == "districts") {
		query.where = ("Subgroup = '" + subgroup + "' AND Subgrouptype = '" + subtype +  "' AND Year = '" + year + "'");
		var queryTask = new esri.tasks.QueryTask(districtTableUrl);
		queryTask.execute(query, function(records) {
					showLayerSymbology(records,field)
		});	
	} else if (dojo.byId("layer").value == "counties") {
		query.where = ("Subgroup = '" + subgroup + "' AND Subgrouptype = '" + subtype +  "' AND Year = '" + year + "'");
		var queryTask = new esri.tasks.QueryTask(countyTableUrl);
		queryTask.execute(query, function(records) {
					showLayerSymbology(records,field)
		});
	} else if (dojo.byId("layer").value == "schools") {
		query.where = ("Subgroup = '" + subgroup + "' AND Subgrouptype = '" + subtype +  "' AND Year = '" + year + "'");
		var queryTask = new esri.tasks.QueryTask(schoolTableUrl);
		queryTask.execute(query, function(records) {
					showLayerSymbology(records,field)
		});
	}
}

function showLayerSymbology(records,field){
	values = []
	var data = []
	
	dojo.forEach(records.features, function (record) {
			var value = record.attributes[field]
			values[record.attributes["ID"]] = value
			if (value != undefined) { data.push(value) }
	});
	var colors = []; color_ids = []; leg_colors = []; leg_color_ids = [];
	for (var color in theme) {
		if (color.indexOf("leg") == -1) { colors.push(theme[color]); color_ids.push(color); }
		if (color.indexOf("leg") != -1) { leg_colors.splice(0,0,theme[color]); leg_color_ids.splice(0,0,color); }
	}
	if ((field == "CohortDropoutRate") || (field == "StillEnrolledRate") || (field == "GEDRate")){
		colors.reverse();
		color_ids.reverse();
		leg_colors.reverse();
		leg_color_ids.reverse();
	}
	
	var category = dojo.byId('category').value;
	var subgroup = dojo.byId('subgroup').value;
	var subtype = dojo.byId('subtype').value;
	var stateMean = parseFloat(cohortMeans["All_All"][category][year]);
	var cohortMean = cohortMeans[subgroup + "_" + subtype][category][year];
	cohortMean = (Math.round(cohortMean*100)/100).toFixed(1);
	
	var stats = new geostats(data);
	var max = stats.max();
	var min = stats.min();
	var diff1 = max - stateMean;
	var diff2 = stateMean - min;
	var diff = (diff1 > diff2) ? diff2 : diff1;
	var class_mean = fieldMap[field].class_mean;
	var interval = setClassIntervals(data, field, year, colors);
	
	if (activeFeatureLayer.graphics.length == 0) {
		var onUpdate = dojo.connect(activeFeatureLayer, "onUpdateEnd", function(){
			setLayerSymbology(activeFeatureLayer, values, interval, max, min, colors, color_ids);
			if (diff < 1) {
				var interval = dojo.map(interval, function(item) {
					var decimal = 100 //2 decimal places
					return (Math.round(item*decimal)/decimal).toFixed(2);
				});
			} else {
				var interval = dojo.map(interval, function(item) {
					return parseInt(item);
				});
			}
			
			setLegendSymbols(leg_colors, leg_color_ids, interval, stateMean, cohortMean);
			dojo.disconnect(onUpdate);
		});
		activeFeatureLayer.show();
		activeFeatureLayer.refresh();
		activeFeatureLayer.hide();
	} else {
		setLayerSymbology(activeFeatureLayer, values, interval, max, min, colors, color_ids);
		if (diff < 1) {
			var interval = dojo.map(interval, function(item) {
				var decimal = 100 //2 decimal places
				return (Math.round(item*decimal)/decimal).toFixed(2);
			});
		} else {
			var interval = dojo.map(interval, function(item) {
				return parseInt(item);
			});
		}		
		setLegendSymbols(leg_colors, leg_color_ids, interval, stateMean, cohortMean);
	}
	closeResultGrid();
	closeDialog();
	map.infoWindow.hide();
}

function setClassIntervals(data, field, year, colors) {
	
	var category = dojo.byId('category').value;
	var stateMean = parseFloat(cohortMeans["All_All"][category][year]);
	var class_mean = fieldMap[field].class_mean;
	
	var stats = new geostats(data);
	var max = stats.max();
	var min = stats.min();
	var diff1 = max - stateMean;
	var diff2 = stateMean - min;
	var diff = (diff1 > diff2) ? diff2 : diff1;
	
	var inc = fieldMap[field].interval
	
	var interval = [class_mean];
	for (var i=1; i < (colors.length/2); i++) {
		var below = ((class_mean - inc*i) < 0) ? 0 : class_mean - inc*i;
		interval.splice(0,0, below);
		
		var above = ((class_mean + inc*i) > 100) ? 100 : class_mean + inc*i;
		interval.push(above);
	}
	interval.splice(0,0,0);
	var rmax = Math.round(max/10)*10;
	var imax = (max % 5 == 0) ? max : (rmax < max) ? (Math.round(max/10)*10) + 5 : Math.round(max/10)*10;
	interval.push(imax);
	
	return interval;
}

function setClassBreaksRenderer(layer, interval, colors, field){
	var k = 0;
	var symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([150,150,150]),0.5), new dojo.Color(nullColor));
	var renderer = new esri.renderer.ClassBreaksRenderer(symbol, field);
	for (var i=0; i<interval.length; i++) {
		if (i % 2 != 0) {
			symbol.setColor(new dojo.Color(colors[k]));
			renderer.addBreak(interval[i-1], interval[i], symbol);
			k++;
		}
	}
	layer.setRenderer(renderer);
	createDataChart();
	layer.show();
	layer.redraw();
	dojo.style("mapProgressBar", { "display":"none" });
}

var title
function setTitle() {
	var text = dojo.byId('category').options[dojo.byId('category').selectedIndex].text + " (%) <br><span class=\"legend_subheader\">"
	if (dojo.byId('subgroup').value != 'All') {
		text += dojo.byId('subgroup').options[dojo.byId('subgroup').selectedIndex].text
	}
	if ((dojo.byId('subgroup').value != 'All')&&(dojo.byId('subtype').value != 'All')) {
		text += ", "
	}
	if (dojo.byId('subtype').value != 'All') {
		text += dojo.byId('subtype').options[dojo.byId('subtype').selectedIndex].text
	}
	text += "<\span>"
	title = text;
	return text;
}

function setLayerSymbology(layer, values, interval, max, min, colors, color_ids) {
	var graphics = layer.graphics
	
	var max = interval.length-1;
	dojo.forEach(graphics, function(graphic){
		var attributes = graphic.attributes
		var value = values[attributes["ID"]]
		var fillColor;
		if (value == undefined) { 
			fillColor = nullColor;
			attributes["color"] = "nullColor"
		} else {
			for (var i=0; i<colors.length; i++) {
				if (value >= interval[i]) {
					fillColor = colors[i];
					attributes["color"] = color_ids[i];
				}
			}
		}
		
		if (layer.geometryType == "esriGeometryPolygon") {
			var symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([150,150,150]),0.5), new dojo.Color(fillColor))
		} else {
			var size = getPointSymbolSizeByScale();
			var symbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, size, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([150,150,150]),0.5), new dojo.Color(fillColor));
		}
		graphic.setSymbol(symbol);
	});
	createDataChart();
	layer.show();
	layer.redraw();
	dojo.style("mapProgressBar", { "display":"none" });
}

function setColorSymbology(newTheme, themeColor){
	dojo.style("mapProgressBar", { "display":"block" });
	
	dojo.fx.wipeOut({
		node: "colorSelectorOptions",
		duration: 300,
		onEnd: function(){
			toggleToolState("colorToolDiv");
			processColorSymbology(newTheme, themeColor);	
		}
	}).play();	
	
	
}

function changePointSymbolSize(){
	var size = getPointSymbolSizeByScale();
	dojo.forEach(schoolFeatureLayer.graphics, function(graphic){
		updatePointSymbolSize(graphic, size);			
	});
	schoolFeatureLayer.redraw();
}

function getPointSymbolSizeByScale(){
	//console.log(map.getLevel() + ' | ' + map.getScale());
	var level = map.getLevel();
	if (level <= 1) { var size = 6; }
	if ((level == 2) || (level == 3)) { var size = 8; }
	if ((level == 4) || (level == 5)) { var size = 10; }
	if (level >= 6) { var size = 12; }
	return size;
}

function updatePointSymbolSize(graphic, size) {
	if (graphic.symbol !== undefined) {
		var symbol = graphic.symbol;
		symbol.setSize(size);
		graphic.setSymbol(symbol);
	}
}

function processColorSymbology(newTheme, themeColor) {
	theme = newTheme;

	if (dojo.byId("category").value != "") {
		var graphics = activeFeatureLayer.graphics
		dojo.forEach(graphics, function(graphic){	
			var value = graphic.attributes["color"];
			var symbol = graphic.symbol;
			if (value != "nullColor") {
				symbol.setColor(new dojo.Color(theme[value]))
			} else {
				symbol.setColor(new dojo.Color(nullColor))
			}
			graphic.setSymbol(symbol);				
		});
	}
	dojo.style("mapProgressBar", { "display":"none" });
	dojo.query('[id*=leg_color]').forEach(function(node){
		dojo.style(node.id, { "backgroundColor": theme[node.id] })
	});
	
	createDataChart();
}

function setLegendSymbols(colors, color_ids, interval, stateMean, cohortMean){
	dojo.byId("legendDiv").innerHTML = "";
	var text = setTitle();
	var legend = "<div>"
	legend += "<div id=\"legendheader\">" + text + "</div>"
	legend += "<table id=\"legend\">"
	dojo.forEach(colors, function(color, i) {
		legend += "<tr><td id=\"" + color_ids[i] + "\" style=\"background-color: " + color + ";\"><img src=\"images/clear.png\" style=\"width:12px; height:12px;\"></td><td style=\"padding-left: 8px; \">" + interval[interval.length - i - 2] + " - " + interval[interval.length - i - 1] + "</td></tr>"
	});
	legend += "<tr><td id=\"null_color\" style=\"background-color: rgb(121,128,105);\"><img src=\"images/clear.png\"></td><td style=\"padding-left: 8px; \">No Data</td></tr>";
	legend += "</table>";
	legend += "<div id=\"legendfooter\">statewide average: " + stateMean + "%</div>";
	if ((dojo.byId('subgroup').value != 'All') || (dojo.byId('subtype').value != 'All')) {
		legend += "<div id=\"legendfooter2\">cohort average: " + cohortMean + "%</div>"
	}
	legend += "</div>"
	
	
	
	dojo.byId("legendDiv").innerHTML = legend;
	dojo.style("legendContentDiv", { "display":"block" });
}

function layerMouseOver(evt, layer) {
	closeDialog();
	//console.log(evt.graphic.attributes)
	
	if (layer.geometryType == "esriGeometryPolygon") {
		var highlightSymbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0,0,0]),1.25), new dojo.Color([255,255,255,0.3]))
	} else {
		var size = getPointSymbolSizeByScale();
		var highlightSymbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, size, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0,0,0]),1.25), new dojo.Color([255,255,255,0.3]));
	}
	var attr = {"OBJECTID": evt.graphic.attributes["OBJECTID"], "ID": evt.graphic.attributes["ID"], "NAME": evt.graphic.attributes["NAME"]}

	var highlightGraphic = new esri.Graphic(evt.graphic.geometry,highlightSymbol,attr);
	highlightLayer.add(highlightGraphic);
}


function layerMouseOut(evt) {
	closeDialog();
	map.infoWindow.hide();	
}
 
 function createDataTable(){
	dojo.style("mapProgressBar", { "display":"block" });
	dojo.empty("gridContent");
	var subgroup = dojo.byId('subgroup').value
	var subtype = dojo.byId('subtype').value
	
	var query = new esri.tasks.Query();
	query.outFields = ["*"];
	query.returnGeometry = false; 
	if (dojo.byId("layer").value == "Secondary") {
		query.where = ("DistType = 'Secondary' AND Subgroup = '" + subgroup + "' AND Subgrouptype = '" + subtype + "' AND Year = '" + year + "'");
		var queryTask = new esri.tasks.QueryTask(districtTableUrl);
		queryTask.execute(query, function(records) {
					populateDataTable(records)
		});	
	} else if (dojo.byId("layer").value == "Unified") {
		query.where = ("DistType = 'Unified' AND Subgroup = '" + subgroup + "' AND Subgrouptype = '" + subtype + "' AND Year = '" + year + "'");
		var queryTask = new esri.tasks.QueryTask(districtTableUrl);
		queryTask.execute(query, function(records) {
					populateDataTable(records)
		});	
	} else if (dojo.byId("layer").value == "districts") {
		query.where = ("Subgroup = '" + subgroup + "' AND Subgrouptype = '" + subtype + "' AND Year = '" + year + "'");
		var queryTask = new esri.tasks.QueryTask(districtTableUrl);
		queryTask.execute(query, function(records) {
					populateDataTable(records)
		});	
	} else if (dojo.byId("layer").value == "counties") {
		query.where = ("Subgroup = '" + subgroup + "' AND Subgrouptype = '" + subtype + "' AND Year = '" + year + "'");
		var queryTask = new esri.tasks.QueryTask(countyTableUrl);
		queryTask.execute(query, function(records) {
					populateDataTable(records)
		});
	} else if (dojo.byId("layer").value == "schools") {
		query.where = ("Subgroup = '" + subgroup + "' AND Subgrouptype = '" + subtype + "' AND Year = '" + year + "'");
		var queryTask = new esri.tasks.QueryTask(schoolTableUrl);
		queryTask.execute(query, function(records) {
					populateDataTable(records)
		});
	}
}
 
function populateDataTable(records){	
	var category = dojo.byId('category').value
	
	var ids = [];
	dojo.forEach(activeFeatureLayer.graphics, function(graphic) {
		if (graphic.visible) { ids.push(graphic.attributes["ID"]) }
	});
	
	var text = dojo.byId('layer').options[dojo.byId('layer').selectedIndex].text + " "
	if ((dojo.byId('subgroup').value != 'All')||(dojo.byId('subtype').value != 'All')) {
		text += "("
	}
	if (dojo.byId('subgroup').value != 'All') {
		text += dojo.byId('subgroup').options[dojo.byId('subgroup').selectedIndex].text
	}
	if ((dojo.byId('subgroup').value != 'All')&&(dojo.byId('subtype').value != 'All')) {
		text += ", "
	}
	if (dojo.byId('subtype').value != 'All') {
		text += dojo.byId('subtype').options[dojo.byId('subtype').selectedIndex].text
	}
	if ((dojo.byId('subgroup').value != 'All')||(dojo.byId('subtype').value != 'All')) {
		text += ")"
	}
	
	dojo.byId("gridTitle").innerHTML = text
	
	var fields = fieldMap[category].field
	var alias = fieldMap[category].alias
	var widths = fieldMap[category].width
	gridItems = []
	
	dojo.forEach(records.features, function (record){
		var visible = dojo.indexOf(ids, record.attributes["ID"]);
		if (visible != -1) {
			var item = {};
			item["id"] = record.attributes["OBJECTID"]
			item["Name"] = record.attributes["Name"]
			dojo.forEach(fields, function(field,i) {
					item[alias[i]] = record.attributes[field]
			})
			gridItems.push(item);
		}
	});
	
	gridItems.sort(function (a,b) {
		// this sorts the array of json objects using the name key    
		return ((a["Name"] < b["Name"]) ? -1 : ((a["Name"] > b["Name"]) ? 1 : 0));
	});
	
	var data = {
		identifier:"id",
		label:"id",
		items:gridItems
	};
	var store = new dojo.data.ItemFileReadStore({data:data});

	// Set up dojox grid structure
	var columns = [{"field":"Name", "name":"Name", "width":"110px"}];
	var width = 175;
	dojo.forEach(alias,function(name,i){
				var header = {};
				header.field = name;
				header.name = name;
				header.width = widths[i] + "px";
				width += widths[i];
				columns.push(header);
	});
	
	var left = map.width/2 - width/2
	var top = 20;
	var height = map.height - top*2;
	var height = (height > 500) ? 500 : height;
	
	dojo.style("gridContainer", {
				"display":"block",
				"width":width + "px",
				"height":height + "px",
				"top":top + "px",
				"left":left + "px"
	});
	
	dojo.style("gridContent", { "height": (height - 35) + "px" });
	
		// create the new dojox grid
	var grid = new dojox.grid.DataGrid({
		store: store,
		clientSort: false,
		structure: columns
	},
	document.createElement('div'));
	// append the new grid to the div "gridContainer":
	dojo.byId("gridContent").appendChild(grid.domNode);

	// Call startup, in order to render the grid:
	grid.startup();
	dojo.style("mapProgressBar", { "display":"none" });
}

function closeResultGrid(){
	dojo.empty("gridContent");
	dojo.style("gridContainer", { "display": "none" })
}

function createDataChart(){
	//dojo.style("chartContentDiv", { "display":"block" });
	var data = [];
	for (var v in values) {
		var value = values[v];
		if (value != undefined) { data.push(value)}
	}
	data.sort()
	var field = dojo.byId('category').value
	
	var colors = [];
	for (var color in theme) {
		if (color.indexOf("leg") != -1) { colors.splice(0,0,theme[color]); }
	}
	if ((field == "CohortDropoutRate") || (field == "StillEnrolledRate") || (field == "GEDRate")){
		colors.reverse();
	}
	
	var stats = new geostats(data);
	var max = stats.max();
	var min = stats.min();
	var cmean = (Math.round(stats.mean()*100)/100).toFixed(1);
	var mean = parseFloat(fieldMap[field].mean[year]);
	var class_mean = fieldMap[field].class_mean;
	var interval = setClassIntervals(data, field, year, colors);
	
	var chartData = [];
	var chartSeries = [];
	var labels = [];
	for (var i=1; i<interval.length; i++) {
		if (i == 1) {
			var bin = dojo.filter(data, function(value) { return value < interval[i]; });
			var text = "< " + interval[i].toFixed(1)
		} else if (i == (interval.length-1)) {
			var bin = dojo.filter(data, function(value) { return value >= interval[i-1]; });
			var text = "> " + interval[i-1].toFixed(1)
		} else {
			var bin = dojo.filter(data, function(value) { return (value >= interval[i-1]) && (value < interval[i]); });
			var text =  interval[i-1].toFixed(1) + " - " + interval[i].toFixed(1);
		}
		chartData.push(bin.length);
		chartSeries.push({ x: i, y: bin.length });
		labels.push({ value: i, text: text });
	}
	
	dojo.byId("chartTitle").innerHTML = title;
	//dojo.byId("chartfooter").innerHTML = "statewide average: " + mean + "%"
	dojo.byId("chartfooter").innerHTML = "percent";
		
	if (chart != undefined) { chart.destroy(); }
	chart = new dojox.charting.Chart2D("chart");
	
	var myTheme =  dojox.charting.themes.Tom;
	myTheme.chart.fill= "#000000";
	myTheme.chart.stroke= "#000000"
	myTheme.plotarea.fill = "#000000";
	chart.setTheme(myTheme)		

	var feature = (dojo.byId("layer").value == 'counties') ? 'counties' : (dojo.byId("layer").value == 'schools') ? 'schools' : 'districts';
	
	chart.addAxis("y", { title: 'number of ' + feature, titleGap:6, titleFont:"normal normal normal 10px Tahoma", titleFontColor:"rgb(255,255,255)", vertical: true, max: Math.max.apply( Math, chartData ), min: 0, fixLower:"major", fixUpper:"major"});
	chart.addAxis("x", {labels:labels, rotation:-45, dropLabels: true, minorTicks: false, majorTick: { length: 2}});
	
	var z = 0;
	chart.addPlot("default", {type: "Columns", gap: 2, stroke: "rgb(150,150,150)", styleFunc: function(item) {
			if (z == colors.length) { z = 0; }
			var index = (colors.length - 1) - z;
			//if ((item.x % 2) == 0) { z++; }
			z++;
			return { fill: colors[index] }
		
	}});
	chart.addSeries("class", chartSeries);
	
	/*chart.addPlot("threshold", { type: "Lines" });
    chart.addSeries("threshold", [{x: 4, y: 0}, {x: 4, y: Math.max.apply( Math, interval ) + 10}], { plot: "threshold", stroke: {
        color: "orange",
        width: 1, 
		style: "Dash"
    } });
	*/
	chart.render();
	
	var h = dojo.getMarginBox(dojo.byId("mapDiv")).h;
	var chartHeight = ((h-440) < 25) ? 155 : 170;
	chart.resize(240, chartHeight);
}

function checkDivOverlap() {

}

/*function updateClassMethod() {
	dojo.style("mapProgressBar", { "display":"block" });
	
	classMethod = dojo.byId("classification").value
	updateLayerSymbology();
	
	dojo.style('colorDiv','display','none')
	dojo.style('search','marginBottom','10px')
	dojo.style('legendDiv','display','block')
}*/

function resetMap(){
	dojo.style("mapProgressBar", { "display":"block" });
	dojo.byId('subgroup').value = "All"
	dojo.byId('subtype').value = "All"
	dojo.byId("category").value = "CohortGraduationRate";
	closeDialog();
	closeResultGrid();
	map.infoWindow.hide();
	symbologyLayer.clear();
	
	districtsFeatureLayer.hide();
	unifiedFeatureLayer.hide();
	secondaryFeatureLayer.hide();
	countiesFeatureLayer.hide();
	schoolFeatureLayer.hide();
	dojo.byId("layer").value = "counties";	
	updateLayerVisibility('counties');
	map.setExtent(maxExtent, true);
}

function showTooltip(evt,content) {
	dialog = new dijit.TooltipDialog({
		id: "tooltipDialog",
		content: content,
		style: "text-align: center; position: absolute; width: 100px; z-index:100"
	});
	dialog.startup();

	dojo.style(dialog.domNode, "opacity", 0.90);
	dijit.placeOnScreen(dialog.domNode, {x: evt.pageX, y: evt.pageY}, ["TL", "BL"]);
	dojo.connect(dialog, "onMouseOver", closeDialog);
}

function closeDialog() {
	if (tooltip) { tooltip.style.display = "none";}
	highlightLayer.clear();
}

function toggleTaskBar() {
	var s = dojo.byId('search')
	var d = dojo.style('search','display')
	if (d=='block') {
		dojo.style('toggleSearchImage', { "marginTop":"5px" } )
		dojo.byId('toggleSearchImage').src = "images/toggle-collapsed.png"
		dojox.fx.wipeOut({ node: "search", duration: 300 }).play();
  } else if (d=='none'){
	  dojo.style('toggleSearchImage', { "marginTop":"2px" } )
	  dojo.byId('toggleSearchImage').src = "images/toggle-expanded.png"
	  dojox.fx.wipeIn({ node: "search", duration: 300 }).play();
  }
}

function toggleFilter(){
	var d = dojo.style('filterDiv','display')
	if (d=='block') {
	  dojo.style('filterDiv','display','none')
  } else if (d=='none'){
	  dojo.style('filterDiv','display','block')
  }

}

function hoverOverColor(id) {
	if (id=="showTableButton") { 
		dojo.style(id, { "backgroundColor": "rgb(60,60,60)" })
	} else {
		dojo.style(id, { "backgroundColor": "rgb(100,100,100)" })
	}
}

function hoverOutColor(id) {
	if (id=="showTableButton") { 
		dojo.style(id, { "backgroundColor": "rgb(30,30,30)" })
	} else {
		dojo.style(id, { "backgroundColor": "rgb(60,60,60)" })
	}
}

function updateTooltipText(value) {
	dataTooltip.attr('label', dataTooltipText[value]);
}

function changeBaseMap(node,layer) {
	var layers = [grayLayer, grayLayerLabels, imageryLayer, imageryLayerLabels, streetsLayer];
	dojo.fx.wipeOut({
		node: "baseMapSelectorOptions",
		duration: 300,
		onEnd: function(){
			dojo.style("baseMapSelector",{
				"borderRadius":"4px 4px 4px 4px"
			});
			dojo.forEach(layers, function(layer){
					layer.hide();
			});
			layer.show()
			if (layer.id == "gray") { grayLayerLabels.show(); };
			if (layer.id == "imagery") { imageryLayerLabels.show(); };
			toggleToolState("baseMapSelector");			
		}
	}).play();	
}

function baseMapSelectorToggle(){
	var display = dojo.style("baseMapSelectorOptions","display");
	if (display=="none") {
		dojo.fx.wipeIn({
			node: "baseMapSelectorOptions",
			duration: 300
		}).play();
	} else {
		dojo.fx.wipeOut({
			node: "baseMapSelectorOptions",
			duration: 300
		}).play();	
	}
	toggleToolState("baseMapSelector");	
}

function toolHover(id, state){
	if (state == 'over') {
		dojo.style(id, { "backgroundImage": dojo.style(id, "backgroundImage").split("-")[0] + '-over.png")' });
	} else {
		dojo.style(id, { "backgroundImage": dojo.style(id, "backgroundImage").split("-")[0] + '-out.png")' });
	}
}

function toggleToolState(id) {
	var img = dojo.style(id, "backgroundImage").split("_")[1].replace('.png")','');
	
	if (img == "on-out") {
		dojo.style(id, { "backgroundImage": dojo.style(id, "backgroundImage").split("_")[0] + '_off-out' + '.png")' });
	} else if (img == "on-over") {
		dojo.style(id, { "backgroundImage": dojo.style(id, "backgroundImage").split("_")[0] + '_off-over' + '.png")' });
	} else if (img == "off-out"){
		dojo.style(id, { "backgroundImage": dojo.style(id, "backgroundImage").split("_")[0] + '_on-out' + '.png")' });
	} else if (img == "off-over") {
		dojo.style(id, { "backgroundImage": dojo.style(id, "backgroundImage").split("_")[0] + '_on-over' + '.png")' });
	}
}

function hover(t, style) {
	t.className=style;
}

function showDialog(id){
	var display = dojo.style(id, "display");
	if (display == "block") {
		dojo.fadeOut({ 
			node: id,
			onEnd: function(){
				dojo.style(id, { "display": "none" })
			}
		}).play();
	} else {
		dojo.style(id, { "display": "block" });
		dojo.fadeIn({ 
			node: id
		}).play();
	}
}

function colorSelectorToggle(){
	var display = dojo.style("colorSelectorOptions","display");
	if (display=="none") {
		dojo.fx.wipeIn({
			node: "colorSelectorOptions",
			duration: 300
		}).play();
	} else {
		dojo.fx.wipeOut({
			node: "colorSelectorOptions",
			duration: 300
		}).play();	
	}
	toggleToolState("colorToolDiv");	
}

function showChartDiv(){
	var display = dojo.style('chartContentDiv', "display");
	if (display == "block") {
		createDataChart();
	}
}

function getIdsBySpatialOveralap() {
	output = [];
	dojo.forEach(countiesFeatureLayer.graphics, function(graphic){
		var query = new esri.tasks.Query();
		var id = graphic.attributes["OBJECTID"]
		query.where = 'OBJECTID = ' + id;
		query.returnGeometry = true;
		var queryTask = new esri.tasks.QueryTask(countiesFeatureLayer.url);
		queryTask.execute(query, function(results) 	{
			//console.log(results.features);
			var geometry1 = results.features[0].geometry;
			var query = new esri.tasks.Query();
			query.returnGeometry = false;
			query.geometry = geometry1;
			query.outFields = ["OBJECTID"]
			query.spatialRelationship = esri.tasks.Query.SPATIAL_REL_CONTAINS;
			var queryTask = new esri.tasks.QueryTask(districtsFeatureLayer.url);
			queryTask.execute(query, function(results) 	{
				//console.log(results.features);
				var queryResultIds = dojo.map(results.features, function(feature){
					return feature.attributes["OBJECTID"];
				});
				var query = new esri.tasks.Query();
				query.returnGeometry = false;
				query.geometry = geometry1;
				query.outFields = ["OBJECTID"]
				query.spatialRelationship = esri.tasks.Query.SPATIAL_REL_OVERLAPS;
				var queryTask = new esri.tasks.QueryTask(districtsFeatureLayer.url);
				queryTask.execute(query, function(results) 	{
					//console.log(results.features);
					dojo.forEach(results.features, function(feature){
						queryResultIds.push(feature.attributes["OBJECTID"]);
					});
					//console.log(queryResultIds);
					//console.log(id + ', "' + queryResultIds.join(",") + '"');
					output.push(id + ', "' + queryResultIds.join(",") + '"');
				});
			});
		});
	});
	//console.log(output);
}