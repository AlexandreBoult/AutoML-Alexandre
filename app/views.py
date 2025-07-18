from flask import render_template, request, jsonify, make_response, redirect, url_for, Blueprint, Response
from prometheus_flask_exporter import PrometheusMetrics
import uuid
import os
import pandas as pd
import hashlib
import sys
sys.path.append('modules')
import pipeline_graph as plg
import shutil
import json


sessions={}


user_blueprint = Blueprint('user_blueprint', __name__)

def purge_cache():
    shutil.rmtree('cache')

@user_blueprint.route('/', methods=["GET"])
def root():
    response = make_response(redirect('/graph_editor'))
    #uid=str(uuid.uuid4())
    uid="test_user"
    response.set_cookie("session", uid, max_age=86400)
    sessions[uid]={'nodes':{},'task_finished':1}
    return response

@user_blueprint.route('/graph_editor', methods=["GET"])
def home():
    return render_template('test2.html',url=url_for('user_blueprint.root'))

@user_blueprint.route('/test', methods=["GET"])
def test():
    return render_template('test.html',url=url_for('user_blueprint.root'))

@user_blueprint.route('/test2', methods=["GET"])
def test2():
    return render_template('test2.html',url=url_for('user_blueprint.root'))

@user_blueprint.route('/test3', methods=["GET"])
def test3():
    return render_template('test3.html',url=url_for('user_blueprint.root'))

@user_blueprint.route("/api/upload_graph", methods=["POST"])
def post_example():
    """POST in server"""
    data = request.get_json()
    uid=request.cookies.get('session')
    # print(data)
    if len(data['nodes'])==len(sessions[uid]['nodes']):
        for id in data['nodes'].keys():
            data['nodes'][id]['content']=sessions[uid]['nodes'][id]['content']
            data['task_finished']=sessions[uid]['task_finished']
    sessions[uid]={'nodes':data['nodes'],'selected_node':data['selected_node'],'task_finished':data['task_finished']}
    # print(sessions[data['uid']]['nodes'])
    #print(data['execute'])
    directory_name=hashlib.sha256(uid.encode('ascii')).hexdigest()
    if data['execute'] != -1:
        graph=plg.parse_graph(list(data['nodes'].values()),directory_name)
        graph[data['execute']].execute()
        for key in graph.keys():
            if hasattr(graph[key], 'content_dict'):
                print('test2')
                content_dict=graph[key].content_dict
                if not content_dict is None:
                    sessions[uid]['nodes'][key]['content']={}
                    for key2 in content_dict.keys():
                        sessions[uid]['nodes'][key]['content'][key2]=str(content_dict[key2].to_html())
            elif hasattr(graph[key], 'content'):
                content=graph[key].content
                if not content is None:
                    sessions[uid]['nodes'][key]['content']=str(content.to_html())

        #sessions[uid]['nodes'][data['execute']]['content']=result
        sessions[uid]['task_finished']=1
        #print(sessions[uid])
    if data['train'] != -1:
        graph=plg.parse_graph(list(data['nodes'].values()),directory_name)
        graph[data['train']].train()
        for key in graph.keys():
            if hasattr(graph[key], 'content_dict'):
                content_dict=graph[key].content_dict
                if not content_dict is None:
                    sessions[uid]['nodes'][key]['content']={}
                    for key2 in content_dict.keys():
                        sessions[uid]['nodes'][key]['content'][key2]=str(content_dict[key2].to_html())
            elif hasattr(graph[key], 'content'):
                content=graph[key].content
                if not content is None:
                    sessions[uid]['nodes'][key]['content']=str(content.to_html())
        #sessions[uid]['nodes'][data['execute']]['content']=result
        sessions[uid]['task_finished']=1
        #print(sessions[uid])
    return jsonify(message="POST request returned")

@user_blueprint.route("/api/upload_file", methods=["POST"])
def post_file():
    """POST in server"""
    uid=request.cookies.get('session')
    file = request.files.get('file')
    file_ext=file.filename.split(".")[-1]
    file_cont=file.read()
    #print(sessions[uid])
    selected_node=sessions[uid]['selected_node']
    directory_name=hashlib.sha256(uid.encode('ascii')).hexdigest()
    if not os.path.exists(f'cache/{directory_name}'):
        os.makedirs(f'cache/{directory_name}')
    with open(f'cache/{directory_name}/{selected_node}.{file_ext}', 'wb') as f:
        f.write(file_cont)
    # print(str(plg.ImportDF(f'cache/{directory_name}/{selected_node}.{file_ext}').execute()))
    # test=pd.read_csv(f'temp/{directory_name}/{selected_node}.{file_ext}')
    print(sessions[uid]['nodes'][selected_node])
    sessions[uid]['nodes'][selected_node]['content']=plg.ImportDF(f'cache/{directory_name}/{selected_node}.{file_ext}',sep=sessions[uid]['nodes'][selected_node]['settings']['separator']).execute().to_html()
    sessions[uid]['nodes'][selected_node]['settings']['file_ext']=file_ext
    return redirect(url_for("user_blueprint.home"))

@user_blueprint.route('/api/get_graph', methods=["GET"])
def get_graph():
    # print(sessions)
    uid=request.cookies.get('session')
    data = sessions[uid]
    response = jsonify(data)
    response.headers['Content-Type'] = 'application/json'
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@user_blueprint.route('/api/download_blueprint', methods=["GET"])
def download():
    uid=request.cookies.get('session')
    content = json.dumps(sessions[uid])
    return Response(content,
                    mimetype='application/json',
                    headers={'Content-Disposition': 'attachment;filename=blueprint.json'})


@user_blueprint.route('/api/upload_blueprint', methods=["POST"])
def upload_blueprint():
    uid=request.cookies.get('session')
    data=json.load(request.files.get('file'))
    sessions[uid]=data
    return redirect(url_for("user_blueprint.home"))