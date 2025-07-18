import {CreateNode} from './display.js';
import {createNewConnection} from './display.js';
import GetWindowHtml from './window_module.js';

export function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

export const session_uid = getCookie('session');

export function uploadGraph(node_execute=-1,train=-1,selectedNode,task_finished,session_uid,NodesDict) {
  if (NodesDict.length != 0 && selectedNode != undefined) {
    if (node_execute != -1) {
      console.log("execute request sent");
      //console.log(JSON.stringify({nodes:NodesDict,uid:session_uid,selected_node:selectedNode,execute:node_execute,task_finished:task_finished}));
    }
    fetch('/api/upload_graph', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({nodes:NodesDict,uid:session_uid,selected_node:selectedNode,execute:node_execute,task_finished:task_finished,train:train})
    })
    .then(response => response.json())
    .then(data => console.log(data));
  }
}

export function defineSessionData(data,NodesDict,currentNode,task_finished,RenderedChange,newConnectionMode,selectedNode,session_uid,draggable,CreateWindow,deleteElement,refreshInterval,refreshTimer,WindowsDict) {
  const Nodes=data.nodes;
  // console.log(Nodes);
  currentNode=data.selected_node;
  task_finished=data.task_finished;
  for (const key in Nodes) {
    if (!NodesDict.hasOwnProperty(key)){
      CreateNode({pos:Nodes[key].pos,type:Nodes[key].type,content:Nodes[key].content,outputs:[],settings:Nodes[key].settings,env:[NodesDict,RenderedChange,draggable,selectedNode,-1,task_finished,session_uid,false]});
    } else {
      NodesDict[key].content=Nodes[key].content;
      for (const key2 in WindowsDict) {
        if (WindowsDict[key2].relatednode==currentNode){
          WindowsDict[key2].html=GetWindowHtml(WindowsDict[key2].html,NodesDict,CreateWindow,deleteElement,uploadGraph,selectedNode,task_finished,session_uid,currentNode,refreshInterval,refreshTimer,currentNode,RenderedChange,newConnectionMode,draggable,WindowsDict);
        }
      }
    }
  }
  for (const key in Nodes) {
    for (const okey in Nodes[key].outputs){
      createNewConnection(key,Nodes[key].outputs[okey],NodesDict,RenderedChange,newConnectionMode,selectedNode,task_finished,session_uid);
    }
  }
}

export function fetchData(refreshTimer,NodesDict,currentNode,refreshInterval,task_finished,RenderedChange,newConnectionMode,selectedNode,session_uid,draggable,CreateWindow,deleteElement,WindowsDict) {
    if (typeof WindowsDict === "undefined") {
       throw new Error("Argument 'WindowsDict' is missing");
    }
    fetch('/api/get_graph')
        .then((response) => response.json())
        .then((data) => {
        defineSessionData(data,NodesDict,currentNode,task_finished,RenderedChange,newConnectionMode,selectedNode,session_uid,draggable,CreateWindow,deleteElement,refreshInterval,refreshTimer,WindowsDict);
        task_finished=data.task_finished;
        clearInterval(refreshTimer);
        refreshTimer = setInterval(function() {
          fetchData(refreshTimer,NodesDict,currentNode,refreshInterval,task_finished,RenderedChange,newConnectionMode,selectedNode,session_uid,draggable,CreateWindow,deleteElement,WindowsDict);
        }, refreshInterval);
        refreshInterval=refreshInterval*2;
        if (refreshInterval > 300000 || task_finished === 1) {
            refreshInterval = 300000;
        }
        //console.log(refreshInterval);
        })
        .catch((error) => {
        // Handle errors
        console.error('Error fetching data:', error);
        });
}



