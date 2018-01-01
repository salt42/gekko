"use strict";
var configSets = [],
    configForm,
    resultCount = 0,
    grid;


var DATA = {
    testConfig: {
        iterations: 1,
    },
    mutator: {
        valuePath: "",
        startValue: 1,
        amount: 1,
    },
    gekkoConfig: {
        watch: {
            exchange: "bitfinex",
            currency: "USD",
            asset: "BTC"
        },
        paperTrader: {
            feeMaker: 0.25,
            feeTaker: 0.25,
            feeUsing: "maker",
            slippage: 0.05,
            simulationBalance: {
                asset: 1,
                currency: 100
            },
            reportRoundtrips: true,
            enabled: true
        },
        tradingAdvisor: {
            enabled: true,
            method: "UO",
            candleSize: 105,
            historySize: 10
        },
        MACD: {
            short: 12,
            long: 26,
            signal: 35,//9,
            thresholds: {
                down: -0.025,
                up: 0.01,//0.025,
                persistence: 1
            }
        },
        UO: {
            first: {
                weight: 4,
                period: 7
            },
            second: {
                weight: 2,
                period: 14
            },
            third: {
                weight: 1,
                period: 28
            },
            thresholds: {
                low: 30,
                high: 70,
                persistence: 1
            }
        },
        PPO: {
            long: 26,
            short: 12,
            signal: 9,
            thresholds: {
                down: -0.020,
                up: 0.02,
                persistence: 2
            }
        },
        backtest: {
            daterange: {
                from: "2017-09-13T00:46:00Z",
                to: "2017-10-13T01:28:00Z"
            }
        },
        performanceAnalyzer: {
            riskFreeReturn: 2,
            enabled: true
        },
        valid: true
    },
    data: {
        candleProps: [
            "close",
            "start"
        ],
        indicatorResults: true,
        report: true,
        roundtrips: true,
        trades: true
    }
};
function showResultReport(cell) {
    console.log(cell.innerHTML);
    // let formatter = new JSONFormatter.default(cell.innerHTML);
    // console.log(formatter);
    // formatter.openAtDepth(1);
    //
    // iziToast.show({
    //     title: "Result Report",
    //     message: formatter.render(),
    //     position: 'center',
    //     theme: 'dark',
    //     progressBar: false,
    //     closeOnEscape: true,
    //     overlay: true,
    //     overlayClose: true,
    //     overlayColor: 'rgba(0, 0, 0, 0.6)',
    // });
}
function createViewStockCandleStick(container, width, height) {

    //view
    var view = new JenScript.View({
        name : container,
        width : width,
        height : height,
        holders : 20,
        west : 80,
        south : 80,
    });


    //date range
    var startDate = new Date(2013, 9, 1);
    var endDate = new Date(2013, 11, 1);

    var proj1 = new JenScript.TimeXProjection({
        cornerRadius : 6,
        name : "proj1",
        minXDate : startDate,
        maxXDate : endDate,
        minY : 19,
        maxY : 24
    });
    view.registerProjection(proj1);

    //device outline
    var outline = new JenScript.DeviceOutlinePlugin({color : 'darkslategrey'});
    proj1.registerPlugin(outline);

    var minor = {
        tickMarkerSize : 2,
        tickMarkerColor : '#9b59b6',
        tickMarkerStroke : 1
    };
    var median = {
        tickMarkerSize : 4,
        tickMarkerColor : '#d35400',
        tickMarkerStroke : 1.2,
        tickTextColor : '#d35400',
        tickTextFontSize : 10
    };
    var major = {
        tickMarkerSize : 8,
        tickMarkerColor : '#2980b9',
        tickMarkerStroke : 3,
        tickTextColor : '#2980b9',
        tickTextFontSize : 12,
        tickTextOffset : 16
    };

    var southMetrics1 = new JenScript.AxisMetricsTiming({
        axis : JenScript.Axis.AxisSouth,
        models : [new JenScript.HourModel({}),new JenScript.DayModel({}),new JenScript.MonthModel({})],
        minor : minor,
        median : median,
        major : major
    });
    proj1.registerPlugin(southMetrics1);


    var westMetrics = new JenScript.AxisMetricsModeled({
        axis : JenScript.Axis.AxisWest
    });
    proj1.registerPlugin(westMetrics);

    var tx1 = new JenScript.TranslatePlugin();
    proj1.registerPlugin(tx1);
    var tpad = new JenScript.TranslatePad();
    tx1.registerWidget(tpad);
    tx1.registerWidget(new JenScript.TranslateCompassWidget({
        ringFillColor : 'pink'
    }));
    tx1.select();

    var stockPlugin = new JenScript.StockPlugin({
        bearishColor : '#c0392b',
        bullishColor : '#2980b9',
    });
    proj1.registerPlugin(stockPlugin);

    stockPlugin.addLayer(new JenScript.CandleStickLayer({
        lowHighColor : 'black'
    }));

    var legend = new JenScript.TitleLegendPlugin({
        layout : 'relative',
        part   : JenScript.ViewPart.Device,
        text   : 'SLV Fixing',
        fontSize : 14,
        textColor : 'purple',
        xAlign : 'right',
        yAlign : 'top',
    });
    proj1.registerPlugin(legend);

    var loader = new StockLoader(proj1,[2013,2014],function(year,stocks){
        stockPlugin.setStocks(stocks);
    });

}
function addResult(conf, data) {
    conf.resultData = data;
    if (!grid) {
        console.log("no grid")
    } else {
        console.log(conf, data);

        grid.row.add(conf).draw();
    }
}
function runTest(conf, cb) {
    $.ajax({
        url: "/api/backtest",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(conf),
        success: function (resData) {
            cb(conf, resData);
        }
    });
}
function getValue(path, data) {
    if (typeof path === "string") path = path.split("/");
    var lastRef = data;
    for(var i = 0; i < path.length - 1; i++) {
        lastRef = lastRef[path[i]];
    }
    return lastRef[path[path.length - 1]];
}
function setValue(path, value, data) {
    if (typeof path === "string") path = path.split("/");
    var lastRef = data;
    for(var i = 0; i < path.length - 1; i++) {
        lastRef = lastRef[path[i]];
    }
    lastRef[path[path.length - 1]] = value;
}
function addValue(path, value, data) {
    if (typeof path === "string") path = path.split("/");
    var lastRef = data;
    for(var i = 0; i < path.length - 1; i++) {
        lastRef = lastRef[path[i]];
    }
    lastRef[path[path.length - 1]] += value;
}
function testFinished() {
    //calculate stats
    let relProfitSum = 0,
        maxRelProfit = configSets[0].resultData.report.relativeProfit,
        minRelProfit = maxRelProfit;

    for (let i = 0; i < configSets.length; i++) {
        if (!configSets[i].resultData || !configSets[i].resultData.report || isNaN(configSets[i].resultData.report.relativeProfit)) continue;
        let relProfit = configSets[i].resultData.report.relativeProfit;
        relProfitSum += relProfit;
        if (relProfit > maxRelProfit) maxRelProfit = relProfit;
        if (relProfit < minRelProfit) minRelProfit = relProfit;
    }
    let $stats = $("body content .result-stats");
    $(".relative-profit .value", $stats).html(Math.round( (relProfitSum / configSets.length) * 100 ) / 100);
    $(".max-profit .value", $stats)     .html(Math.round( maxRelProfit * 100 ) / 100);
    $(".min-profit .value", $stats)     .html(Math.round( minRelProfit * 100 ) / 100);
}
function prepareTest() {
    var count = 5,
        i = 0,
        ii = 0,
        testConfig = {},
        readyCount = 0;

    DATA = configForm.getData();
    localStorage.setItem('lastData', JSON.stringify(DATA));


    let mutateValuePath = DATA.mutator.valuePath.split("/");
    let mutatValueName = mutateValuePath[mutateValuePath.length - 1];
    if (grid) {
        grid.clear().draw();
        grid.destroy();
        $('#result-list').empty();
    }
    grid = $('#result-list').DataTable({
        "processing": true,
        // "ajax": "data/objects_deep.txt",

        // fixedHeader: {
        //     header: true,
        //     footer: true
        // },
        columnDefs: [
            {
                "targets": 0,
                "render": function (data, type, row, meta) {
                    return data;
                }
            },
            {
                "targets": 2,
                "render": function (data, type, row, meta) {
                    let color = (data < 0) ? "color-red" : "color-green";
                    return '<span class="' + color + '">' + (Math.round(data * 100) / 100) + ' %</span>';
                }
            },
            {
                "targets": 3,
                "render": function (data, type, row, meta) {
                    return '<div class="report" onclick="showResultReport(this)">' + JSON.stringify(data, null, 4) + '</div>';
                }
            },
        ],
        "columns": [
            {
                title: "Mutate (" + mutatValueName + ")",
                data: DATA.mutator.valuePath.replace(/\//g, ".")
            },
            {
                title: "Trades",
                data: "resultData.report.trades"
            },
            {
                title: "Rel Profit %",
                data: "resultData.report.relativeProfit"
            },
            {
                title: "Report",
                data: "resultData.report"
            },
        ]
    });


    count = DATA.testConfig.iterations;

    configSets = [];
    if (!DATA.mutator.startValue || DATA.mutator.startValue === "" ||
        !DATA.mutator.amount || DATA.mutator.amount === "" ||
        !DATA.mutator.valuePath || DATA.mutator.valuePath === "") {
        //error
        configSets.push(DATA);
    } else {
        setValue(DATA.mutator.valuePath, DATA.mutator.startValue, DATA);
        for (i = 0; i < count; i++) {
            testConfig = JSON.parse(JSON.stringify(DATA));
            addValue(DATA.mutator.valuePath, DATA.mutator.amount * i, testConfig);
            //adjust history size
            let historyMinutes = testConfig.gekkoConfig.tradingAdvisor.historySize;
            let candleSize = testConfig.gekkoConfig.tradingAdvisor.candleSize;
            testConfig.gekkoConfig.tradingAdvisor.historySize = Math.round(historyMinutes / candleSize);
            configSets.push(testConfig);
        }
    }

    for (i = 0; i < count; i++) {
        runTest(configSets[i], function(conf, data) {
            addResult(conf, data);
            readyCount++;
            if (readyCount >= count) {
                setTimeout(function() {
                    testFinished();
                }, 1000);
            }
        });
    }
}
function loadLastConfig() {
    let data = JSON.parse(localStorage.getItem("lastData"));
    console.log(data);
    // data = DATA;
    if (data) {
        DATA = data;
        configForm.setData(data);
    } else {
        //@todo show error
    }
}
$(document).ready(function () {
    configForm = jsonForm($("sidebar > .test-config")[0], DATA, {
        meta: {
            gekkoConfig: {
                watch: {
                    exchange: {
                        type: "select",
                        options: ["bitfinex", "poloniex"]
                    },
                    currency: {
                        type: "select",
                        options: ["BTC"]
                    },
                    asset: {
                        type: "select",
                        options: ["ETC", "DASH", "XRP", "ETP"]
                    }
                },
                tradingAdvisor: {
                    method: {
                        type: "select",
                        options: ["UO", "MACD", "PPO"]
                    }
                }
            },
            mutator: {
                valuePath: {
                    type: "select",
                    options: [
                        "gekkoConfig/tradingAdvisor/candleSize",
                        "gekkoConfig/tradingAdvisor/historySize",
                        "gekkoConfig/PPO/long",
                        "gekkoConfig/PPO/short",
                        "gekkoConfig/PPO/signal",
                        "gekkoConfig/PPO/thresholds/up",
                        "gekkoConfig/PPO/thresholds/down",
                        "gekkoConfig/PPO/thresholds/persistence",
                        "gekkoConfig/MACD/short",
                        "gekkoConfig/MACD/long",
                        "gekkoConfig/MACD/signal",
                        "gekkoConfig/MACD/thresholds/down",
                        "gekkoConfig/MACD/thresholds/up",
                        "gekkoConfig/MACD/thresholds/persistence",
                        "gekkoConfig/UO/first/weight",
                        "gekkoConfig/UO/first/period",
                        "gekkoConfig/UO/second/weight",
                        "gekkoConfig/UO/second/period",
                        "gekkoConfig/UO/third/weight",
                        "gekkoConfig/UO/third/period",
                        "gekkoConfig/UO/thresholds/low",
                        "gekkoConfig/UO/thresholds/heigh",
                        "gekkoConfig/UO/thresholds/persistence",
                    ]
                }
            }
        }
    });
    loadLastConfig();
    $("sidebar > nav > ul > li").click(function(e) {
        $("sidebar > nav > ul > li").removeClass("active");
        $(this).addClass("active");

        prepareTest();
    });
    // createViewStockCandleStick($("#graph")[0],600, 200);
});
