import pandas as pd
import glob
import os
import re
from sklearn.preprocessing import LabelEncoder, OneHotEncoder
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import f1_score, accuracy_score

model_dict={};

class HtmlString:
    def __init__(self,string=""):
        self.content=string
    def to_html(self):
        return self.content

class Node:
    def __init__(self):
        self.inputs=[]
        self.outputs=[]
        self.nb_inputs=-1
        self.nb_outputs=-1
        self.id=None
        self.content=None
    def add_output_node(self,output):
        if self.nb_outputs != -1 :
            assert len(self.outputs) <= self.nb_outputs
        if output.nb_inputs != -1 :
            assert len(output.inputs) <= output.nb_inputs
        output.inputs.append(self)
        self.outputs.append(output)
    def add_input_node(self,input0):
        if self.nb_inputs != -1 :
            assert len(self.inputs) <= self.nb_inputs
        if input0.nb_outputs != -1 :
            assert len(input0.outputs) <= input0.nb_outputs
        input0.outputs.append(self)
        self.inputs.append(input0)
    def set_id(self,id):
        self.id=id
        return self

class ImportDF(Node):
    def __init__(self, file_path, sheet_name : str="Sheet1" , sep : str="", index_col=None, header='infer', orient='columns'):
        super().__init__()
        self.file_path=file_path
        self.sheet_name=sheet_name
        self.sep=sep
        self.file_ext=file_path.split(".")[-1]
        self.index_col=index_col
        self.header=header
        # self.names=names
        self.orient=orient
    def get_inputs(self):
        return []
    def execute(self):
        # print(self.file_path)
        match self.file_ext:
            case "csv":
                if self.sep == "" :
                    df = pd.read_csv(self.file_path, index_col=self.index_col, header=self.header, engine='python', on_bad_lines='skip')
                else : df = pd.read_csv(self.file_path, sep=self.sep, index_col=self.index_col, header=self.header, engine='python', on_bad_lines='skip')
            case "tsv":
                if self.sep == "" : self.sep='\t'
                df = pd.read_csv(self.file_path, sep=self.sep, index_col=self.index_col, header=self.header, engine='python')
            case "xlsx":
                df = pd.read_excel(self.file_path, sheet_name=self.sheet_name)
            case "json":
                df = pd.read_json(self.file_path, orient=self.orient)
        self.content=df
        return df

class DFNode(Node):
    """for testing purposes"""
    def __init__(self,df):
        super().__init__()
        self.content=df
    def execute(self):
        return self.content

class DFFilter(Node):
    def __init__(self, filter : str):
        super().__init__()
        self.nb_inputs=1
        self.nb_outputs=1
        self.filter=filter
    def execute(self):
        df=self.inputs[0].execute()
        try :
            filtered_df=df.query(self.filter)
            self.content=filtered_df
        except pd.errors.UndefinedVariableError:
            print('error : undefined variable')
            self.content='error : undefined variable'
            return None
        return filtered_df

class DFColumnsSelect(Node):
    def __init__(self, columns : list):
        super().__init__()
        self.columns=columns
        self.nb_inputs=1
        self.nb_outputs=1
    def execute(self):
        df=self.inputs[0].execute()
        # print(df.columns)
        try :
            selected_columns=df[self.columns]
            self.content=selected_columns
        except pd.errors.UndefinedVariableError:
            self.content='error : undefined variable'
            return None
        return pd.DataFrame(selected_columns)

class ConcatenateDF(Node):
    def __init__(self, axis : int=0, join='outer'):
        super().__init__()
        self.axis = axis
        self.join=join
    def execute(self):
        df_concat=self.inputs[0].execute()
        for i in range(1,len(self.inputs)):
            df_concat = pd.concat([df_concat, self.inputs[i].execute()], axis=self.axis, join=self.join)
        self.content=df_concat
        return df_concat

class DFPivotTable(Node):
    def __init__(self, index, values, aggfunc):
        super().__init__()
        self.nb_inputs=1
        self.nb_outputs=1
        self.index=index
        self.values=values
        self.aggfunc=aggfunc
    def execute(self):
        p_table = pd.pivot_table(self.inputs[0].execute(), index=self.index, values=self.values, aggfunc=self.aggfunc)
        return p_table
    
class OneHotEncoder_(Node):
    def __init__(self):
        super().__init__()
        self.encoder=None
    def execute(self):
        encoder = OneHotEncoder(categories='auto')
        matrix = encoder.fit_transform(self.inputs[0].execute())
        self.content = pd.DataFrame.sparse.from_spmatrix(matrix)
        return self.content
    
class LabelEncoder_(Node):
    def __init__(self):
        super().__init__()
        self.encoder=None
    def execute(self):
        encoder = LabelEncoder()
        array = encoder.fit_transform(self.inputs[0].execute())
        self.content = pd.DataFrame(array)
        return self.content

class TrainTestSplit(Node):
    def __init__(self,ratio : float=0.8, order : int=0, rd_state : int=0):
        super().__init__()
        self.ratio=float(ratio)
        self.order=int(order)
        self.rd_state=int(rd_state)
        self.content_dict=None
    def execute(self):
        X_train, X_test, y_train, y_test = train_test_split(self.inputs[self.order].execute(), self.inputs[1-self.order].execute(), test_size=1-self.ratio, random_state=self.rd_state)
        self.content_dict={'X_train':X_train, 'X_test':X_test, 'y_train':y_train, 'y_test':y_test}
        return self.content_dict

class KNeighbors(Node):
    def __init__(self,n_neighbors:int=5,huid:str=''):
        super().__init__()
        self.n_neighbors=int(n_neighbors)
        self.pred=None
        self.huid=huid
    def train(self):
        neigh = KNeighborsClassifier(n_neighbors=self.n_neighbors)
        self.inputs[0].execute()
        neigh.fit(self.inputs[0].content_dict['X_train'],self.inputs[0].content_dict['y_train'])
        model_dict[self.huid+self.id]=neigh
        return 'success'
    def execute(self):
        assert self.huid+self.id in model_dict.keys()
        model=model_dict[self.huid+self.id]
        self.inputs[0].execute()
        y_pred = model.predict(self.inputs[0].content_dict['X_test'])
        self.pred=pd.DataFrame(y_pred)
         #might change in the future
        self.content=HtmlString(f"F1 score : {f1_score(self.inputs[0].content_dict['y_test'], y_pred, average='macro')}" + f"<br>Accuracy : {accuracy_score(self.inputs[0].content_dict['y_test'], y_pred)}")
        return self.pred

def parse_graph(node_list,session_dir):
    pd.options.display.max_columns = None
    pd.options.display.max_rows = None
    graph={}
    for i in range(len(node_list)):
        node=node_list[i]
        match node['type']:
            case 'empty':
                graph[node["id"]]=DFNode(pd.DataFrame()).set_id(node["id"])
            case 'import':
                files=glob.glob(os.path.join(f"cache/{session_dir}", f"{node["id"]}.{node['settings']['file_ext']}"))
                if len(files)>0 : graph[node["id"]]=ImportDF(files[0],sep=node['settings']['separator']).set_id(node["id"])
            case 'filter':
                graph[node["id"]]=DFFilter(node['settings']['filter']).set_id(node["id"])
            case 'columns_select':
                graph[node["id"]]=DFColumnsSelect(re.split(r"\s*,\s*",node['settings']['columns'])).set_id(node["id"])
            case 'concatenate':
                graph[node["id"]]=ConcatenateDF(node['settings']['axis'],node['settings']['join']).set_id(node["id"])
            case 'one_hot_encoder':
                graph[node["id"]]=OneHotEncoder_().set_id(node["id"])
            case 'label_encoder':
                graph[node["id"]]=LabelEncoder_().set_id(node["id"])
            case 'pivot_table':
                graph[node["id"]]=DFPivotTable(node['settings']['index'],node['settings']['values'],node['settings']['aggfunc']).set_id(node["id"])
            case 'train_test_split':
                graph[node["id"]]=TrainTestSplit(node['settings']['ratio'],node['settings']['order'],node['settings']['rd_state']).set_id(node["id"])
            case 'k_neighbors':
                graph[node["id"]]=KNeighbors(node['settings']['n_neighbors'],'').set_id(node["id"])
    for key in graph.keys():
        for i in range(len(node_list)):
            node=node_list[i]
            if key in node["outputs"]:
                graph[node["id"]].add_output_node(graph[key])
    return graph

if __name__=="__main__":
    from sklearn.datasets import load_iris
    iris = load_iris()
    X = pd.DataFrame(iris.data, columns=iris.feature_names)
    y = pd.DataFrame(iris.target,columns=['target'])
    
    Xnode=DFNode(X)
    ynode=DFNode(y)

    # Nodes definition
    split=TrainTestSplit()
    split.add_input_node(Xnode)
    split.add_input_node(ynode)
    
    knn=KNeighbors()
    knn.add_input_node(split)
    knn.execute()
    # Graphs creation
    print(knn.predict())
    # execute pipeline graph
