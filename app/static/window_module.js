import {fetchData} from './netcode.js';

function bakeFunction(func,arg) {
  const f = () => func(arg);
  return f
}

const window_html_static_dict={
  'import':`<button onclick='document.getElementById("fileinput").click();'>📄 Click here to import file</button>
  <form action="/api/upload_file" method="post" enctype="multipart/form-data">
  <input style="display:none;" id="fileinput" type="file" name="file" onchange="this.form.submit()" id="upload_file"/>
  </form>`
}

function window_dynamic_html(tempnode,nodeid=undefined){
  if(tempnode.type == 'import'){return window_html_static_dict[tempnode.type] + `<input placeholder="separator" type="text" class="settings" name="separator" value="${tempnode.settings.separator}"></input><div class="scrollable-table">${tempnode.content}</div>`;}
  if(tempnode.type == 'columns_select'){
    let result=`<label>Select columns :</label><input class="settings" name="columns" value="${tempnode.settings.columns}"></input><div class="scrollable-table">${tempnode.content}</div>`;
    return result;
  }
  if(tempnode.type == 'concatenate'){
    let result=`<label>Axis :</label><input class="settings" name="axis" value="${tempnode.settings.axis}"></input><div>Join mode :</div><input class="settings" name="join" value="${tempnode.settings.join}"></input><div class="scrollable-table">${tempnode.content}</div>`;
    return result;
  }
  if(tempnode.type == 'filter'){
    let result=`<label>Filter query :</label><input class="settings" name="filter" value="${tempnode.settings.filter}"></input><div class="scrollable-table">${tempnode.content}</div>`;
    return result;
  }
    if(tempnode.type == 'pivot_table'){
    let result=`<label>index :</label><input class="settings" name="index" value="${tempnode.settings.index}"></input>`;
    result=result + `<label>values :</label><input class="settings" name="values" value="${tempnode.settings.values}"></input>`;
    result=result + `<label>aggrefation function :</label><input class="settings" name="aggfunc" value="${tempnode.settings.aggfunc}"></input>`;
    return result + `<div class="scrollable-table">${tempnode.content}</div>`;
  }
  if(tempnode.type == 'one_hot_encoder'){
    let result=`<div class="scrollable-table">${tempnode.content}</div>`;
    return result;
  }
  if(tempnode.type == 'label_encoder'){
    let result=`<div class="scrollable-table">${tempnode.content}</div>`;
    return result;
  }
  if(tempnode.type == 'train_test_split'){
    let result=`<label>ratio :</label><input class="settings" name="ratio" value="${tempnode.settings.ratio}"></input>`;
    result=result + `<label>order :</label><input class="settings" name="order" value="${tempnode.settings.order}"></input>`;
    result=result + `<label>random state :</label><input class="settings" name="rd_state" value="${tempnode.settings.rd_state}"></input>`;
    result=result + `<div class="scrollable-table"><label>X_train :</label>${tempnode.content.X_train}`;
    result=result + `<label>y_train :</label>${tempnode.content.y_train}`;
    result=result + `<label>X_test :</label>${tempnode.content.X_test}`;
    result=result + `<label>y_test :</label>${tempnode.content.y_test}</div>`;
    return result
  }
  if(tempnode.type == 'k_neighbors'){
    let result = `<button id="${nodeid}train" class="trainbutton">🤖​ Train</button>`
    result=result + `<br><label>Number of neighbors :</label><input class="settings" name="n_neighbors" value="${tempnode.settings.n_neighbors}"></input><div class="normaldiv">${tempnode.content}</div>`;
    return result;
  }
  else{return '';}
}

function generate_settings(target,tempnode){
  if(tempnode.type == 'import'){
    if (target == undefined){
      tempnode.settings={file_ext:'',separator:''};
    }
    else if (target.name == "separator"){
      tempnode.settings.separator=target.value;
    }
  }
  if(tempnode.type == 'columns_select'){
    if (target == undefined){
      tempnode.settings={columns:''};
    }
    else if (target.name == "columns"){
      console.log(tempnode.settings);
      tempnode.settings.columns=target.value;
    }
    console.log(tempnode.settings);
  }
  if(tempnode.type == 'concatenate'){
    if (target == undefined){
      tempnode.settings={axis:0,join:"outer"};
    }
    else if (target.name == "axis"){
      console.log(tempnode.settings);
      tempnode.settings.axis=target.value;
    }
    else if (target.name == "join"){
      console.log(tempnode.settings);
      tempnode.settings.join=target.value;
    }
    console.log(tempnode.settings);
  }
  if(tempnode.type == 'filter'){
    if (target == undefined){
      tempnode.settings={filter:""};
    }
    else if (target.name == "filter"){
      console.log(tempnode.settings);
      tempnode.settings.filter=target.value;
    }
    console.log(tempnode.settings);
  }
  if(tempnode.type == 'pivot_table'){
    if (target == undefined){
      tempnode.settings={index:"",values:"",aggfunc:"mean"};
    }
    else if (target.name == "index"){
      console.log(tempnode.settings);
      tempnode.settings.index=target.value;
    }
    else if (target.name == "values"){
      console.log(tempnode.settings);
      tempnode.settings.values=target.value;
    }
    else if (target.name == "aggfunc"){
      console.log(tempnode.settings);
      tempnode.settings.aggfunc=target.value;
    }
  }
  if(tempnode.type == 'one_hot_encoder'){
    if (target == undefined){
      tempnode.settings={};
    }
  }
  if(tempnode.type == 'label_encoder'){
    if (target == undefined){
      tempnode.settings={};
    }
  }
  if(tempnode.type == 'train_test_split'){
    if (target == undefined){
      tempnode.settings={ratio:0.8,order:0,rd_state:0};
    }
    else if (target.name == "ratio"){
      console.log(tempnode.settings);
      tempnode.settings.ratio=target.value;
    }
    else if (target.name == "order"){
      console.log(tempnode.settings);
      tempnode.settings.order=target.value;
    }
    else if (target.name == "rd_state"){
      console.log(tempnode.settings);
      tempnode.settings.rd_state=target.value;
    }
  }
  if(tempnode.type == 'k_neighbors'){
    if (target == undefined){
      tempnode.settings={n_neighbors:5};
    }
    else if (target.name == "n_neighbors"){
      console.log(tempnode.settings);
      tempnode.settings.n_neighbors=target.value;
    }
  }
}

function GetWindowHtml(tempwindow,NodesDict,CreateWindow,deleteElement,uploadGraph,selectedNode,task_finished,session_uid,nodeid=undefined,refreshInterval,refreshTimer,currentNode,RenderedChange,newConnectionMode,draggable,WindowsDict) {
  if (typeof WindowsDict === "undefined") {
    throw new Error("Argument 'WindowsDict' is missing");
  }
  let tempnode = NodesDict[nodeid];
  //console.log(tempnode.settings);
  const html=`<div class="windowheader" id="${tempwindow.id}header">${nodeid} settings<button id="${tempwindow.id}close" class="closebutton">✕</button></div>
  <label>Change node type : </label><select class="typebutton">🔠 Change type</button><br>
      <option value="empty">empty</option>
      <option value="import">import data</option>
      <option value="columns_select">select columns</option>
      <option value="filter">filter dataframe</option>
      <option value="concatenate">concatenate dataframes</option>
      <option value="pivot_table">pivot table</option>
      <option value="one_hot_encoder">one hot encoder</option>
      <option value="label_encoder">label encoder</option>
      <option value="train_test_split">train test split</option>
      <option value="k_neighbors">k nearest neighbors</option>
  </select>
  <button id="${tempwindow.id}execute" class="executebutton">▶️ Execute</button>
  <br>`
  tempwindow.innerHTML = html + '<div class="">' + window_dynamic_html(tempnode,tempwindow.id) + '</div>';
  function RebuildHtml(event=undefined) {
    //console.log(selectedNode);
    if (event != undefined){
      if (event.target.classList.contains('typebutton')){
        tempnode.type=event.target.value;
        tempnode.settings={};
        document.getElementById(tempnode.id+"header").innerHTML=tempnode.id + " | " + tempnode.type;
        generate_settings(undefined,tempnode);
        console.log(tempnode.settings);
      }
      if (event.target.classList.contains('settings')){
        generate_settings(event.target,tempnode);
        //console.log(tempnode.settings);
      }
    }
    uploadGraph(-1,-1,nodeid,task_finished,session_uid,NodesDict);
    tempwindow.innerHTML=html;
    //console.log(tempnode.settings);
    tempwindow.innerHTML += window_dynamic_html(tempnode);
    tempwindow.querySelector(`#${tempwindow.id}close`).addEventListener("mouseup", function(e) {
      var e = e || window.event;
      var btnCode = e.button;
      if (btnCode === 0) {
        deleteElement(tempwindow);
      }
    });
    //console.log('est');
    var mySelect = tempwindow.querySelector('.typebutton');
    //console.log(mySelect);
    for(var i, j = 0; i = mySelect.options[j]; j++) {
      if(i.value == tempnode.type) {
          //console.log(j);
          mySelect.selectedIndex = j;
          break;
      }
    }
    var executeButton = tempwindow.querySelector('.executebutton');
    executeButton.addEventListener("mouseup", function() {
      uploadGraph(tempnode.id,-1,nodeid,0,session_uid,NodesDict);
      console.log(NodesDict);
      task_finished=0;
      refreshInterval=100;
      fetchData(refreshTimer,NodesDict,currentNode,refreshInterval,task_finished,RenderedChange,newConnectionMode,selectedNode,session_uid,draggable,CreateWindow,deleteElement,WindowsDict);
    });
    var trainButton = tempwindow.querySelector('.trainbutton');
    if (trainButton != null) {
      trainButton.addEventListener("mouseup", function() {
        uploadGraph(-1,tempnode.id,nodeid,0,session_uid,NodesDict);
        console.log(NodesDict);
        task_finished=0;
        refreshInterval=100;
        fetchData(refreshTimer,NodesDict,currentNode,refreshInterval,task_finished,RenderedChange,newConnectionMode,selectedNode,session_uid,draggable,CreateWindow,deleteElement,WindowsDict);
      });
    }
  }
  RebuildHtml();
  tempwindow.addEventListener('change', function(event) {
    RebuildHtml(event);
  });
  return tempwindow
}


export default GetWindowHtml