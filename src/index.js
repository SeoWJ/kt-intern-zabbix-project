import cytoscape from 'cytoscape';
import './style.css'; // webpack으로 묶어줘야 하니 css파일을 진입점인 index.js 에 import.
import { Zabbix } from './Zabbix.js';
import dagre from "cytoscape-dagre";
import { setDimStyle, setFocus, setOpacityElement, setResetFocus, showNodeInfo, closeNodeInfo } from "./OnMouseEvents.js"

const ipExp = /((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})/g;
const exclusiveIp = /^127/;

const loadBalancerIconUrl = 'https://raw.githubusercontent.com/SeoWJ/img/main/lb.png';
const switchIconUrl = 'https://raw.githubusercontent.com/SeoWJ/img/main/0.switch.png';
const instanceIconUrl = 'https://raw.githubusercontent.com/SeoWJ/img/main/instance_green.png';
const instanceWarningIconUrl = 'https://raw.githubusercontent.com/SeoWJ/img/main/instance_red.png'
const serverIconUrl = 'https://image.flaticon.com/icons/png/512/622/622397.png';
const cloudIconUrl = 'https://raw.githubusercontent.com/SeoWJ/img/main/0.cloud.png';
const unknownDeviceIconUrl = 'https://raw.githubusercontent.com/SeoWJ/img/main/0.unknown.png';

// const loadBalancerIconUrl = './lb.png';
// const switchIconUrl = './switch.png';
// const instanceIconUrl = './instance.png';
// const cloudIconUrl = './cloud.png';
//const unknownDeviceIconUrl = './unknown.png';

// edge & arrow 크기값
const edgeWidth = '2px';
var edgeActiveWidth = '2px';
const arrowScale = 0.8;
const arrowActiveScale = 1.2;

const dimColor = '#dfe4ea';
const edgeColor = '#ced6e0';
const nodeColor = '#FFFFFF';
const nodeActiveColor = '#ffa502';

// 상위 node & edge color
const successorColor = '#ff6348';
// 하위 node & edge color
const predecessorsColor = '#1e90ff';

cytoscape.use(dagre);

// cytoscape 객체 초기 설정
var cy = cytoscape({
    container: document.getElementById('cy'), // container to render in
    elements: [],
    style: [
        {
            selector: 'node',
            style: {
                //'shape': 'rectangle',
                'shape': 'ellipse',
                'background-color': nodeColor,
                'background-image': switchIconUrl,
                'background-fit': 'contain',
                'background-opacity': 0,
                'label': 'data(label)',
                'width': 50,
                'height': 50,
                'font-size': 13,
                'color': '#FFFFFF'
            }
        },

        {
            selector: 'edge',
            style: {
                'width': edgeWidth,
                'line-color': edgeColor,
                'target-arrow-color': edgeColor,
                'target-arrow-shape': 'triangle',
                'arrow-scale': arrowScale,
            }
        }
    ]
});

// OnClick 이벤트
cy.on('tap', function (e) {
    var connectUrl = e.target.data('url');

    if (connectUrl && connectUrl != ' ') {
        window.open(connectUrl);
    }
}); // left click

cy.on('cxttap', "node", function (e) {
    if (this.scratch().restData == null) {
        // Save node data and remove
        this.scratch({
            restData: this.successors().targets().remove()
        });
        if (this == cy.$('node[id = "10424"]')[0]) {
            cy.layout({
                name: 'dagre',
            }).run();
        }
    } else {
        // Restore the removed nodes from saved data
        this.scratch().restData.restore();
        if (this == cy.$('node[id = "10424"]')[0]) {
            var subgraphLayout = this.scratch().restData.layout({
                name: 'circle',
                radius: 3,
                fit: true,
                startAngle: 0.5 * Math.PI,
                sweep: 0.75 * Math.PI,
                boundingBox: { x1: this.position()['x'] - 100, y1: this.position()['y'] - 100, w: 200, h: 200 }
            })
            subgraphLayout.run();
        }

        this.scratch({
            restData: null
        });
    }
}); // right click

// OnMouse 이벤트
cy.on('tapstart mouseover', 'node', function (e) {
    console.log(e.target.position());
    //document.addEventListener("mousemove", showNodeInfo(e.target.data()['id'], e.target.data()['type'], zabbix));

    setDimStyle(cy, {
        'background-color': dimColor,
        'line-color': dimColor,
        'target-arrow-color': dimColor,
        'color': dimColor
    });
    setFocus(e.target, successorColor, predecessorsColor, edgeActiveWidth, arrowActiveScale);
});
cy.on('tapend mouseout', 'node', function (e) {
    //closeNodeInfo();
    setResetFocus(e.cy);
});

// 브라우저 크기 조정시 화면 크기 조정
let resizeTimer;

window.addEventListener('resize', function () {
    this.clearTimeout(resizeTimer);
    resizeTimer = this.setTimeout(function () {
        cy.fit();
    }, 200);
});

// 자동 새로고침
// setTimeout(function () {
//     location.reload();
// }, 60000
// );

// 자빅스 객체 생성 및 api 호출
var zabbix = new Zabbix("http://211.253.37.78:10002/zabbix/api_jsonrpc.php");
var hosts;
hosts = zabbix.getHostData();
console.log(hosts);
hosts.then((hosts) => {
    var items = zabbix.getItemData();
    items.then((items) => {
        // make host nodes.
        for (var i in hosts) {
            var node = cy.add({
                "data": {
                    "id": hosts[i]['hostid'],
                    "label": hosts[i]['host'],
                    "tag": hosts[i]['interfaces'][0]['ip'],
                    "url": "http://211.253.37.78:10002/zabbix/zabbix.php?action=latest.view&filter_hostids%5B%5D=" + hosts[i]['hostid'] + "&filter_set=1"
                }
            });

            if (hosts[i]['hostid'] == 10084) {
                node.style('width', 100);
                node.style('height', 100);
                node.style('background-image', cloudIconUrl);
                node.style('text-opacity', 0);
            }
        }
        // END make host nodes.

        // make sample data for CISCO Switch L3
        for (var i = 0; i < 8; i++) {
            var node = cy.add({
                "data": {
                    "id": 11000 + i,
                    "label": "Unknown Device",
                    "type": "Unknown Device"
                }
            })
            cy.add({
                "data": {
                    "source": 10424,
                    "target": node.data()['id']
                }
            })
            node.style('background-image', unknownDeviceIconUrl);
        }
        cy.add({
            "data": {
                "source": 10084,
                "target": 10424
            }
        })
        cy.$('node[id = "10424"]').scratch({
            restData: cy.$('node[id = "10424"]').successors().targets().remove()
        });

        cy.$('node[id = "10424"]')[0].data('type', 'switch');
        // END make sample data for CISCO Switch L3

        for (var i in items) {
            if (items[i]['name'] == "Is This Apache Server" && items[i]['lastvalue'] == 1) {
                cy.$('node[id = "' + items[i]["hostid"] + '"]')[0].data('type', 'apacheServer');
                cy.$('node[id = "' + items[i]["hostid"] + '"]')[0].style('background-image', instanceIconUrl);
                if(items[i]["hostid"] == 10427){
                    cy.$('node[id = "' + items[i]["hostid"] + '"]')[0].style('background-image', instanceWarningIconUrl);
                }
            }
            else if (items[i]['name'] == "Is This HAProxy LoadBalancer" && items[i]['lastvalue'] == 1) {
                cy.$('node[id = "' + items[i]["hostid"] + '"]')[0].data('type', 'lb');
                cy.$('node[id = "' + items[i]["hostid"] + '"]')[0].style('background-image', loadBalancerIconUrl);
                cy.add({
                    "data": {
                        "source": "10084",
                        "target": items[i]['hostid']
                    }
                })
            }
            if (items[i]['name'] == "HAProxy Load Balancer config" && items[i]['lastvalue'] != "") {
                var ipList = items[i]['lastvalue'].match(ipExp);

                for (var j in ipList) {
                    if (!exclusiveIp.test(ipList[j])) {
                        for (var k = 0; k < cy.nodes().length; k++) {
                            if (cy.nodes()[k].data()['tag'] == ipList[j]) {
                                cy.add({
                                    "data": {
                                        "source": items[i]['hostid'],
                                        "target": cy.nodes()[k].data()['id']
                                    }
                                });
                            }
                        }
                    }
                }
            }
        }
        cy.layout({
            name: 'dagre',
        }).run();
    })
})