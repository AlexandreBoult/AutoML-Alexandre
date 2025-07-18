import GetWindowHtml from './window_module.js';
import {uploadGraph} from './netcode.js';
// import {defineSessionData} from './netcode.js';
import {fetchData} from './netcode.js';
import { session_uid } from './netcode.js';

// var LinesDict={};

const dummy = document.createElement('element');
document.body.appendChild(dummy);
const defaultStyle = getComputedStyle(dummy);
// document.body.classList.add('draggable');

var newConnectionMode=false;

var selectedNode=undefined;
var currentLine=undefined;
var contextMode=false;
var dragPlane=true;
var preventDrag=false;

var currentWindow=undefined;
var currentNode=undefined;
var NodesDict={};
var WindowsDict={};
var RenderedChange=true; //minimap rendering variable
var refreshInterval = 300000;
let refreshTimer;
var task_finished=1;
var draggable=[];

fetchData(refreshTimer,NodesDict,currentNode,refreshInterval,task_finished,RenderedChange,newConnectionMode,selectedNode,session_uid,draggable,CreateWindow,deleteElement,WindowsDict);

function openInNewTab(url) {
  window.open(url, '_blank').focus();
}

const download_blueprint = document.createElement("button");

download_blueprint.innerText="⬇️​ download blueprint";

download_blueprint.addEventListener("mouseup", function() {
  openInNewTab("/api/download_blueprint");
});

download_blueprint.classList.add("UI");

document.body.appendChild(download_blueprint);

const upload_blueprint = document.createElement("button");

document.body.appendChild(upload_blueprint);

upload_blueprint.outerHTML=`<button class="UI" onclick='document.getElementById("fileinput").click();'>⬆️​ upload blueprint</button>
<form action="/api/upload_blueprint" method="post" enctype="multipart/form-data">
<input style="display:none;" id="fileinput" type="file" name="file" onchange="this.form.submit()" id="upload_file"/>
</form>`;



function preventDragTrue() {
  preventDrag=true;
}

function changeCurrentWindow(elid) {
  if (currentWindow != elid) {
    var max_z=0;
    //var second_max_z=0;
    for (const key in WindowsDict) {
      max_z=Math.max(max_z,Number(WindowsDict[key].html.style.zIndex));
    }
    for (const key in WindowsDict) {
      //console.log(key);
      if (key != elid) {
        WindowsDict[key].html.style.zIndex=Number(WindowsDict[key].html.style.zIndex)-1;
        // console.log(Number(WindowsDict[key].html.style.zIndex));
      }
    }
    currentWindow=elid;
    // console.log('a');
    // console.log(max_z);
    //WindowsDict[id_max].html.style.zIndex=second_max_z;
    WindowsDict[elid].html.style.zIndex=max_z;
  }
  //console.log(second_max_z);
  //
}

// test window code
export function CreateNode(args) {
    let pos = args.pos;
    let type=args.type;
    let content=args.content;
    let outputs=args.outputs;
    let settings=args.settings
    let [NodesDict,RenderedChange,draggable,selectedNode,node_execute,task_finished,session_uid,upload] = args.env;
    // console.log(args.content);
    // console.log(args.type);
    var id=-1;
    var key_nb=undefined;
    for (const key in NodesDict){
        key_nb=key.split('e')[1];
        id=Math.max(id,key_nb);
      }
    var tempnode = document.createElement("div");
    tempnode.id=`node${id+1}`;
    tempnode.addEventListener("mousedown",function() {
        tempnode.style.zIndex = '98';
    });
    tempnode.addEventListener("mouseup",function() {
        tempnode.style.zIndex = '';
    });
    tempnode.classList.add("draggable");
    tempnode.classList.add("node");
    tempnode.innerHTML = `<div class="nodeheader" id="${tempnode.id}header">${tempnode.id} | ${type}</div>
    <button id="${tempnode.id}button">⚙️ Settings</button>`
    tempnode.style.top=`${pos.y}px`;
    tempnode.style.left=`${pos.x}px`;
    document.body.appendChild(tempnode);
    NodesDict[`node${id+1}`]={html:tempnode,id:`node${id+1}`,outputs:outputs,lines:[],name:`node ${id+1}`,type:type,content:content,pos:pos,settings:settings};
    document.getElementById(tempnode.id+'button').addEventListener("mousedown", bakeFunction(CreateWindow,{pos:{x:200,y:100},nodeid:tempnode.id}));
    RenderedChange=true;
    draggable = document.querySelectorAll(".draggable");
    selectedNode=tempnode.id;
    if (upload) {
      uploadGraph(node_execute,-1,selectedNode,task_finished,session_uid,NodesDict);
    }
}

//CreateWindow({x:0,y:0});
// end test

function CreateWindow(args) {
  //console.log(args);
  let pos = args.pos;
  //let type=undefined;
  //let settings=undefined;
  let nodeid=undefined;
  let condition=true;
  //type = args.type;
  //settings = args.settings;
  nodeid = args.nodeid;
  for (const key in WindowsDict){
    if (WindowsDict[key].relatednode!=undefined && WindowsDict[key].relatednode==nodeid){
      condition = false;
      //changeCurrentWindow(key);
      deleteElement(WindowsDict[key].html);
    }
  }
  if (condition){
    var id=-1;
    var key_nb=undefined;
    for (const key in WindowsDict){
        key_nb=key.split('w')[2];
        id=Math.max(id,key_nb);
      }
    var tempwindow = document.createElement("div");
    tempwindow.style.zIndex=100+id+1;
    tempwindow.id=`window${id+1}`;
    tempwindow.addEventListener("mousedown",function() {
      bakeFunction(changeCurrentWindow(tempwindow.id));
    });
    tempwindow.classList.add("draggable");
    tempwindow.classList.add("window");
    tempwindow = GetWindowHtml(tempwindow,NodesDict,CreateWindow,deleteElement,uploadGraph,selectedNode,task_finished,session_uid,nodeid,refreshInterval,refreshTimer,currentNode,RenderedChange,newConnectionMode,draggable,WindowsDict);
    tempwindow.style.top=`${pos.y}px`;
    tempwindow.style.left=`${pos.x}px`;
    document.body.appendChild(tempwindow);
    WindowsDict[`window${id+1}`]={html:tempwindow,id:tempwindow.id,name:`window ${id+1}`,relatednode:nodeid};
    draggable = document.querySelectorAll(".draggable");
    //console.log(draggable);
    document.getElementById(tempwindow.id+'close').addEventListener("mousedown", preventDragTrue);
    document.getElementById(tempwindow.id+'close').addEventListener("mouseup", function(e) {
      var e = e || window.event;
      var btnCode = e.button;
      if (btnCode === 0) {
        deleteElement(tempwindow);
      }
    });
    document.getElementById(tempwindow.id+'execute').addEventListener("mousedown", function() {
      uploadGraph(tempwindow.relatednode,-1,selectedNode,task_finished,session_uid,NodesDict);
    });
    let trainbutton=document.getElementById(tempwindow.id+'train');
    if (trainbutton!=null){
      document.getElementById(tempwindow.id+'train').addEventListener("mousedown", function() {
      uploadGraph(-1,tempwindow.relatednode,selectedNode,task_finished,session_uid,NodesDict);
    });
    }
    currentWindow=tempwindow.id;
  }
}



const ContextMenu = document.createElement("div");
ContextMenu.innerHTML =`<div id="custom-context-menu" class="context-menu">
<div class="context-item" id="context1">Menu-1</div>
<div class="context-item" id="context2">Menu-2</div>
</div>`;
document.body.appendChild(ContextMenu);

function bakeFunction(func,arg) {
  const f = () => func(arg);
  return f
}

function deleteElement(e) {
  if (e.classList.contains("node")) {
    for (const key in NodesDict) {
      for (const okey in NodesDict[key].outputs) {
        if (NodesDict[key].outputs[okey] === e.id) {
          delete NodesDict[key].outputs[okey];
          NodesDict[key].lines[okey].remove();
        }
      }
    }
    for (const key in NodesDict[e.id].lines) {
      NodesDict[e.id].lines[key].remove();
    }
    delete NodesDict[e.id];
    uploadGraph(-1,-1,selectedNode,task_finished,session_uid,NodesDict);
  } else if (e.classList.contains("line")) {
    for (const key in NodesDict) {
      for (const okey in NodesDict[key].outputs) {
        if (NodesDict[key].outputs[okey] === e.id.split("_")[1]) {
          delete NodesDict[key].outputs[okey];
        }
      }
    }
    uploadGraph(-1,-1,selectedNode,task_finished,session_uid,NodesDict);
  } else if (e.classList.contains("window")) {
    delete WindowsDict[e.id];
    currentWindow=undefined;
  }
  e.remove();
  RenderedChange=true;
}

function resetMenu(pos) {
  document.getElementById("context1").replaceWith(document.getElementById("context1").cloneNode(true));
  document.getElementById("context1").addEventListener("mousedown", bakeFunction(CreateNode,{pos:pos,type:'empty',content:'',outputs:[],settings:{},env:[NodesDict,RenderedChange,draggable,selectedNode,-1,task_finished,session_uid,true]}));
  document.getElementById("context1").innerHTML = "➕ Create node";
  let element = document.getElementById("context2");
  if (element !== null) {
    element.remove();
  }
  }

function toggleConnectionMode(nodeid) {
  newConnectionMode=true;
  currentNode=nodeid;
}

export function createNewConnection(nid1,nid2,NodesDict,RenderedChange,newConnectionMode,selectedNode,task_finished,session_uid,upload=true) {
  newConnectionMode=false;
  if (!NodesDict[nid1].outputs.includes(nid2) && NodesDict[nid2] != undefined) {
    NodesDict[nid1].outputs.push(nid2);
    var line = document.createElement("div");
    line.classList.add("line");
    line.id=`${nid1}_${nid2}`;
    document.body.appendChild(line);
    NodesDict[nid1].lines.push(line);
    drawLineBetweenElmts(NodesDict[nid1].html,NodesDict[nid2].html,line);
  }
  RenderedChange=true;
  if (upload) {
    uploadGraph(-1,-1,selectedNode,task_finished,session_uid,NodesDict);
  }
}

function nodeMenu(nodehtml) {
    let newElement = document.createElement('div');
    newElement.innerHTML = "🗑️ Delete node";
    newElement.id="context2";
    newElement.classList.add("context-item");
    document.getElementById("custom-context-menu").appendChild(newElement);
    document.getElementById("context1").replaceWith(document.getElementById("context1").cloneNode(true));
    document.getElementById("context1").innerHTML = "🔗 Connect node";
    document.getElementById("context2").addEventListener("mousedown", bakeFunction(deleteElement,nodehtml));
    document.getElementById("context1").addEventListener("mousedown", bakeFunction(toggleConnectionMode,nodehtml.id));
  }

function connectionMenu(connectionhtml) {
    document.getElementById("context1").replaceWith(document.getElementById("context1").cloneNode(true));
    document.getElementById("context1").innerHTML = "🗑️ Delete Connection";
    document.getElementById("context1").addEventListener("mousedown", bakeFunction(deleteElement,connectionhtml));
  }

function intersectRect(p, r) {
    return (p.x > r.left && 
             p.x < r.right && 
             p.y < r.bottom && 
             p.y > r.top);
}

function intersectDiag(p, r) {
  return (p.x > r.left &&
           p.x < r.right && 
           p.y < r.bottom && 
           p.y > r.top);
}

function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (dragPlane) {
    document.onmousedown=dragMouseDown;
  }
  else if (document.getElementById(elmnt.id + "header")) {
    // if present, the header is where you move the DIV from:
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
    document.getElementById(elmnt.id).onmousedown = preventDragTrue;
  }
  function dragMouseDown(e) {
    e = e || window.event;
    //e.preventDefault();
    if (e.button != 2 && !preventDrag) {
      // get the mouse cursor position at startup:
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      // call a function whenever the cursor moves:
      document.onmousemove = elementDrag;
    }
  }
  function elementDrag(e) {
    RenderedChange=true;
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    if (!dragPlane && currentNode != undefined) {
      NodesDict[currentNode].pos.y = NodesDict[currentNode].html.offsetTop - pos2;
      NodesDict[currentNode].pos.x = NodesDict[currentNode].html.offsetLeft - pos1;
      NodesDict[currentNode].html.style.top = (NodesDict[currentNode].html.offsetTop - pos2) + "px";
      NodesDict[currentNode].html.style.left = (NodesDict[currentNode].html.offsetLeft - pos1) + "px";
    } else if (!dragPlane && currentWindow != undefined) {
      WindowsDict[currentWindow].html.style.top = Math.max(WindowsDict[currentWindow].html.offsetTop - pos2, 0) + "px";
      WindowsDict[currentWindow].html.style.left = Math.max(WindowsDict[currentWindow].html.offsetLeft - pos1, -1570) + "px";
    } else if (dragPlane) {
      // drag the background grid
      var style = window.getComputedStyle(document.body);
      var bgpos = style.backgroundPosition.split(',')[0].split(' ');
      var oldx = bgpos[0].replace('px','');
      var oldy = bgpos[1].replace('px','');
      document.body.style.backgroundPosition = `${oldx-pos1}px ${oldy-pos2}px`;
      for (const nkey in NodesDict) {
        NodesDict[nkey].pos.y = NodesDict[nkey].html.offsetTop - pos2;
        NodesDict[nkey].pos.x = NodesDict[nkey].html.offsetLeft - pos1;
        NodesDict[nkey].html.style.top = (NodesDict[nkey].html.offsetTop - pos2) + "px";
        NodesDict[nkey].html.style.left = (NodesDict[nkey].html.offsetLeft - pos1) + "px";
      }
    }
    for (const nkey in NodesDict) {
      for (const okey in NodesDict[nkey].outputs) {
        drawLineBetweenElmts(NodesDict[nkey].html,NodesDict[NodesDict[nkey].outputs[okey]].html,NodesDict[nkey].lines[okey]);
      }
    }
  }
  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
    dragPlane=false;
    preventDrag=false;
    uploadGraph(-1,-1,selectedNode,task_finished,session_uid,NodesDict);
  }
}

const context = document.querySelector(".context-menu");

function menu(show = true) {
      context.style.display = show ? "block" : "none";
  }

window.addEventListener("contextmenu", (e) => {
      e.preventDefault();    
      const topPx = e.y + context.offsetHeight > window.innerHeight ? window.innerHeight - context.offsetHeight : e.y;
      const leftPx = e.x + context.offsetWidth > window.innerWidth ? window.innerWidth - context.offsetWidth : e.x;
      context.style.top = topPx + "px";
      context.style.left = leftPx + "px";
      contextMode=true;
      resetMenu({x:leftPx,y:topPx});
      //node right click
      currentNode=undefined;
      currentLine=undefined;
      let preventMenu=false;
      // currentWindow=undefined;
      document.querySelectorAll(".node").forEach(element => {
        var rect=element.getBoundingClientRect();
        if (intersectRect(e,rect)) {
          currentNode=element.id;
          selectedNode=element.id;
        };
      });
      document.querySelectorAll(".window").forEach(element => {
        var rect=element.getBoundingClientRect();
        if (intersectRect(e,rect)) {
          preventMenu=true;
        };
      });
      document.querySelectorAll(".line").forEach(element => {
        var rect=element.getBoundingClientRect();
        if (intersectDiag(e,rect)) {
          currentLine=element;
        };
      });
      if (currentNode != undefined) {
        nodeMenu(NodesDict[currentNode].html);
      } else if (currentLine != undefined) {
        connectionMenu(currentLine);
      }
      if (!preventMenu) {menu();}
});
window.addEventListener('mousedown', (e) => {
    draggable = document.querySelectorAll(".draggable");
    menu(false);
    // node selection for connection
    if (newConnectionMode && !contextMode) {
      for (const nkey in NodesDict) {
        var rect=NodesDict[nkey].html.getBoundingClientRect();
        if (intersectRect(e,rect)) {
          createNewConnection(currentNode,nkey,NodesDict,RenderedChange,newConnectionMode,selectedNode,task_finished,session_uid);
        }
      }
      newConnectionMode=false;
    } else if (!newConnectionMode) {
      // click detection on node or window
      dragPlane=true;
      preventDrag=false;
      for (const nkey in NodesDict) {
        var rect=NodesDict[nkey].html.getBoundingClientRect();
        if (intersectRect(e,rect)) {
          dragPlane=false;
          selectedNode=nkey;
          // currentWindow=undefined;
          currentNode=nkey;
          break;
        }
      }
      for (const wkey in WindowsDict) {
        var rect=WindowsDict[wkey].html.getBoundingClientRect();
        if (intersectRect(e,rect)) {
          dragPlane=false;
          //currentWindow=wkey;
          currentNode=undefined;
          break;
        }
      }
    }
    contextMode=false;
});

window.addEventListener('mouseup', () => {
  dragPlane=false;
  preventDrag=false;
});


function drawLineBetweenElmts(el1,el2,line) {
    var rect1 = el1.getBoundingClientRect();
    var rect2 = el2.getBoundingClientRect();
    var p1={x:rect1.right,y:(rect1.top+rect1.bottom)/2}
    var p2={x:rect2.left,y:(rect2.top+rect2.bottom)/2}
    drawLine(p1,p2,line);
}

function drawLine(p1,p2,line){
    const dis=Math.sqrt((p1.x-p2.x)**2+(p1.y-p2.y)**2);
    const xmid=(p1.x+p2.x)/2;
    const ymid=(p1.y+p2.y)/2;
    const sloperad=Math.atan2(p1.y-p2.y,p1.x-p2.x);
    const slopedeg=sloperad*180/Math.PI;
    line.style.zIndex=0;
    line.style.width=`${dis}px`;
    line.style.top=`${ymid}px`;
    line.style.left=`${xmid-dis/2}px`;
    line.style.transform = `rotate(${slopedeg}deg)`;
}





// Minimap code

function renderHtmlToImg(img, html, scale) {

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${img.width/scale}" height="${img.height/scale}">
<foreignObject width="100%" height="100%">
  <div xmlns="http://www.w3.org/1999/xhtml">${html}</div>
</foreignObject>
</svg>`;

  const svgBlob = new Blob( [svg], { type: 'image/svg+xml;charset=utf-8' } );
  const svgObjectUrl = URL.createObjectURL( svgBlob );

  const oldSrc = img.src;
  if( oldSrc && oldSrc.startsWith( 'blob:' ) ) { // See https://stackoverflow.com/a/75848053/159145
      URL.revokeObjectURL( oldSrc );
  }

  img.src = svgObjectUrl;
}

function getComputedStylesAsArray(element) {
  const computedStyle = getComputedStyle(element);
  var styleStr = '';
  var value = "";
  var key = 0;
  for (let i = 0; i < computedStyle.length; i++) {
    key=computedStyle[i];
    value = computedStyle.getPropertyValue(key);
    if (defaultStyle[key] !== value ) {
      styleStr+=`${key}:${value};`
    }
  }
  return styleStr;
}

function translateToPureHtmlCss(element,ignore=['window','UI']) {
  var result=''
  var ignored=false;
  for (const key in ignore) {
    if (element.nodeName != '#text') {
      ignored=element.classList.contains(ignore[key]) || ignored;
    }
  }
  if (element != undefined && !ignored) {
    const childNodes = element.childNodes;
    const childElements = Array.from(childNodes);
    if (element.nodeName === '#text') {
      result+=element.textContent;
    } else if (element.nodeName.toLowerCase() != 'img') {
      const styles = getComputedStylesAsArray(element);
      result+=`<${element.nodeName.toLowerCase()} style="${styles}">`
    }
    for (const key in childElements) {
      result+=translateToPureHtmlCss(childElements[key]);
    }
    if (element.nodeName != '#text' && element.nodeName.toLowerCase() != 'img') {result+=`</${element.nodeName.toLowerCase()}>`}
  }
  return result
}





function mainLoop()
{
  draggable.forEach(element => {
    dragElement(element);
  });
  if (RenderedChange){
    renderHtmlToImg(document.getElementById('minimap'), translateToPureHtmlCss(document.body), 0.12);
    RenderedChange=false;
  }
}

setInterval(mainLoop, 20);




