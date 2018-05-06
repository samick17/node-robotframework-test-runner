/*
 * @Author: Samick.Hsu <boneache@gmail.com>
 * @CreatedDate: 2018/05/06
 */
//
(function() {
	var baseLineX = 24, baseLineY = 16;
	var chartWidth = 800, chartHeight = 200;
	var fontSize = 12;
	var currentTab = 'total';
	var currentCategory = 'All Tests';
	function buildElement(template) {
		var templateText = template;
		if(Array.isArray(templateText)) {
			templateText = templateText.join('\n');
		}
		return $(jade.compile(templateText)());
	}

	function drawCircle(ctx, x, y, radius, color) {
		ctx.save();
		ctx.beginPath();
		ctx.fillStyle = color;
		ctx.arc(x, y, radius, 0, 2*Math.PI);
		ctx.fill();
		ctx.stroke();
		ctx.restore();
	}
	function drawLine(ctx, from, to, color, options) {
		ctx.save();
		ctx.beginPath();
		if(options) {
			if(options.lineWidth) {
				ctx.lineWidth = options.lineWidth;
			}
			if(options.dash) {
				ctx.setLineDash(options.dash);
			}
		}
		ctx.strokeStyle = color;
		ctx.moveTo(from.x, from.y);
		ctx.lineTo(to.x, to.y);
		ctx.stroke();
		ctx.restore();
	}
	function drawText(ctx, x, y, text) {
		ctx.save();
		ctx.font = fontSize + "px Arial";
		ctx.fillText(text, x, y);
		ctx.restore();
	}
	function drawCoordinateSystem(ctx, coord) {
		/*x-axis*/
		drawLine(ctx, {
			x: baseLineX,
			y: chartHeight - baseLineY
		}, {
			x: chartWidth,
			y: chartHeight - baseLineY
		}, '#000000');
		/*y-axis*/
		drawLine(ctx, {
			x: baseLineX,
			y: chartHeight - baseLineY
		}, {
			x: baseLineX,
			y: 0
		}, '#000000');
		/*horizontal basline*/
		/*xAxis*/
		var unitX = coord.currentUnit.x;
		var unitY = coord.currentUnit.y;
		var basex = coord.x.from;
		var offsetX = (fontSize*.5);
		var offsetY = (fontSize*.5);
		for(var i = coord.x.from; i <= coord.x.to; i++) {
			var currentPoint = {
				x: baseLineX + unitX * (i - basex),
				y: chartHeight - baseLineY
			};
			drawText(ctx, currentPoint.x - offsetX + 2, chartHeight, i);
		}
		/*yAxis*/
		for(var i = coord.y.from+1; i <= coord.y.to + 1; i++) {
			var currentY = chartHeight - (i * unitY) - baseLineY;
			drawLine(ctx, {
				x: baseLineX,
				y: currentY
			}, {
				x: chartWidth,
				y: currentY
			}, '#aaa', {
				lineWidth: 1
			});
			drawText(ctx, baseLineX - (i.toString().length * 5) - offsetX - 4, currentY + offsetY, i);
		}
	}
	function calculateCoord(data, tab, category) {
		var minY, maxY;
		var xAxis = [];
		for(var i in data) {
			var x = parseInt(i);
			xAxis.push(x);
			var statistics = data[i];
			var result = statistics[tab][category];
			var pass = parseInt(result.pass);
			var fail = parseInt(result.fail);
			var min = Math.min(pass, fail);
			var max = Math.max(pass, fail);
			if(!minY || minY > min) {
				minY = min;
			}
			if(!maxY || maxY < max) {
				maxY = max;
			}
		}
		return {
			x: {
				from: xAxis[0],
				to: xAxis[xAxis.length - 1]
			},
			y: {
				from: minY,
				to: maxY
			}
		};
	}
	function drawTotal(ctx, statisticsData, coord) {
		var unitX = coord.currentUnit.x;
		var unitY = coord.currentUnit.y;
		var totalX = baseLineX, totalY = chartHeight - baseLineY;
		ctx.beginPath();
		ctx.moveTo(totalX, totalY);
		var baseX;
		for(var i in statisticsData) {
			if(!baseX) {
				baseX = i;
			}
			var statistics = statisticsData[i];
			ctx.fillStyle = 'rgba(0,0,0,0.2)';
			totalX = baseLineX + unitX * (i - baseX);
			totalY = chartHeight - unitY * statistics[currentTab][currentCategory].total - baseLineY;
			ctx.lineTo(totalX, totalY);
		}
		ctx.lineTo(totalX, chartHeight - baseLineY);
		ctx.fill();
	}

	function main() {
		var bodyElem = $('body');
		var canvasElem = buildElement([
			'canvas.trend-chart'
			]);
		var ctx = canvasElem[0].getContext('2d');
		var canvas = canvasElem[0]
		canvas.width = chartWidth;
		canvas.height = chartHeight;
		canvas.style.width = chartWidth;
		canvas.style.height = chartHeight;

		var statisticsData = data;
		var coord = calculateCoord(statisticsData, currentTab, currentCategory);
		coord.currentUnit = {
			x: Math.floor(chartWidth / (coord.x.to - coord.y.from)),
			y: Math.floor(chartHeight / (coord.y.to - coord.y.from + 3))
		};
		var srcPoints = {};
		var baseX;
		var points = [];
		drawCoordinateSystem(ctx, coord);
		var unitX = coord.currentUnit.x;
		var unitY = coord.currentUnit.y;
		var typeOfLines = [{
			name: 'pass',
			color: 'green'
		}, {
			name: 'fail',
			color: 'red'
		}];
		drawTotal(ctx, statisticsData, coord);
		var statisticsPoints = [];
		function drawPointsTemplate(doDrawLineCallback, doPostDraw) {
			for(var i in statisticsData) {
				if(!baseX) {
					baseX = i;
				}
				var statistics = statisticsData[i];
				var x = baseLineX + unitX * (i - baseX);
				var pointYs = {};
				typeOfLines.forEach(function(typeOfLine) {
					var countOfTestCases = statistics[currentTab][currentCategory][typeOfLine.name];
					//console.log(countOfTestCases);
					if(countOfTestCases > 0) {
						pointYs[typeOfLine.name] = chartHeight - unitY * countOfTestCases - baseLineY;
						var currentPoint = {
							x: x,
							y: pointYs[typeOfLine.name]
						};
						if(srcPoints[typeOfLine.name]) {
							if(doDrawLineCallback) {
								doDrawLineCallback(ctx, srcPoints[typeOfLine.name], currentPoint, typeOfLine.color, {
									lineWidth: 2,
								}, statistics);
							}
						}
						srcPoints[typeOfLine.name] = currentPoint;
						if(doPostDraw) {
							doPostDraw(ctx, x, currentPoint.y, 4, typeOfLine.color, statistics);
						}
					}
					
				});
			}
		}
		drawPointsTemplate(function(ctx, srcPoint, destPoint, color, options, statistics) {
			drawLine(ctx, srcPoint, destPoint, color, options);
		});
		drawPointsTemplate(null, function(ctx, x, y, radius, color, statistics) {
			drawCircle(ctx, x, y, radius, color);
			statisticsPoints.push({
				x: x,
				y: y,
				radius: radius,
				statistics: statistics
			});
		});
		var lastHoveredSPoint;
		var statisticsInfoElem = buildElement([
			'div(style="border:1px solid black;")',
			'  .no(style="font-weight:bold;font-family:sans-serif;")',
			'  .result',
			'  .total',
			'  .pass',
			'  .fail',
			'  .start-time',
			'  .elapsed-time'
			]);
		statisticsInfoElem.hide();
		canvasElem.mousemove(function(evt) {
			var point = {
				x: evt.offsetX,
				y: evt.offsetY
			};
			function detectHoveredStatistics() {
				for(var i in statisticsPoints) {
					var sPoint = statisticsPoints[i];
					if(Math.abs(point.x - sPoint.x) < sPoint.radius && Math.abs(point.y - sPoint.y) < sPoint.radius) {
						return sPoint;
					}
				}
			}
			var sPoint = detectHoveredStatistics();
			if(sPoint) {
				if(lastHoveredSPoint !== sPoint) {
					lastHoveredSPoint = sPoint;
					var resultData = sPoint.statistics[currentTab][currentCategory];
					statisticsInfoElem.css({
						position: 'absolute',
						'background-color': resultData.status === 'PASS' ? 'rgba(0,96,0,0.8)' : 'rgba(96,0,0,0.8)',
						color: 'white',
						'font-weight': 'bold',
						left: sPoint.x + 'px',
						top: sPoint.y + 'px',
						width: 'auto',
						height: 'auto',
						padding: '4px',
						cursor: 'pointer'
					});
					statisticsInfoElem.find('.no').text('#'+resultData.name);
					statisticsInfoElem.find('.result').text('Status: '+resultData.status);
					statisticsInfoElem.find('.total').text('Total: '+resultData.total);
					statisticsInfoElem.find('.pass').text('Pass: '+resultData.pass);
					statisticsInfoElem.find('.fail').text('Fail: '+resultData.fail);
					statisticsInfoElem.find('.elapsed-time').text('ElapsedTime: '+resultData.elapsedTime);
					statisticsInfoElem.find('.start-time').text('StartTime: '+new Date(resultData.startTime).toString());
					statisticsInfoElem.show();
				}
			} else {
				lastHoveredSPoint = undefined;
				statisticsInfoElem.hide();
			}
		});
		statisticsInfoElem.mouseleave(function() {
			statisticsInfoElem.hide();
		});
		bodyElem.append(statisticsInfoElem);
		bodyElem.append(canvasElem);
	}
	$(function() {
		main();
	});
})();