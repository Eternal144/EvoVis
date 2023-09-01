import json
import eel
import os
import spam
import numpy as np
import pandas as pd
import shutil
import argparse

eel.init('web')
ADD = 0
UPD = 1
DEL = 2
KEEP = 3
global args
record = []
states_path = ''
result_file_path  = ''
lfs_path = ''
data_file = ''
train_number = 0
embedding_file = ''
record_file = ''
result = []
count = 1

# get function names from state directory
def get_func(l):
    func = []
    for i in range(l):
        state = []
        path = '{}{}/'.format(states_path, i)
        files = os.listdir(path)
        for file in files:
            with open(path+file) as f:
                state.append(f.read())
        func.append(state)
    return func

# get results of the lfs
def compute(funcVersions):
    # result = []
    # print(funcVersions)
        # for (vid, version) in enumerate(funcVersions):
    #     if vid != 0:
    #         result.append(spam.apply_lfs(version, vid, funcVersions[vid-1]))
    #     else:
    #         result.append(spam.apply_lfs(version, vid))

    # with open(result_file_path, 'w') as f:
    #     json.dump(result, f)
    global count
    print('-' * 20 + str(count) + '-' * 20)
    count = count +1
    global result
    current = funcVersions[-1]
    if len(funcVersions) > 1 :
        last = funcVersions[-2]
        result.append(spam.apply_lfs(current, len(funcVersions)-1, last))
    else:
        result.append(spam.apply_lfs(current, 0))
    return result
    

# get label function name from its code
def getFuncName(code):
    return code.split('def ')[1].split('(x)')[0]

# create a map from function name to function code
def parseMap(funcs):
    map = {}
    for func in funcs:
        map[getFuncName(func)] = func
    return map

def refresh(lastFuncs):
    temp = {}
    for func in lastFuncs:
        if lastFuncs[func]['state'] != DEL:
            temp[func] = {'changed': 0, 'state': KEEP, 'codes': lastFuncs[func]['codes']}
    return temp

def parseRecord(rowRecords,rowCodes):
    funcVersion = [ {} for _ in rowRecords ]
    mapList = []
    for codes in rowCodes:
        mapList.append(parseMap(codes))
    for ( i, rec ) in enumerate(rowRecords):
        deltaCodesMap = mapList[i]
        add = rec['add']
        dlt = rec['del']
        update = rec['update']
        funcVersion[i] = {} if i == 0 else refresh(funcVersion[i-1])
        if len(add) > 0:
            for x in add:
                funcVersion[i][x] = {
                    'changed': 1,
                    'state': ADD,
                    'codes': deltaCodesMap.get(x)
                }
        if len(dlt) > 0:
            for x in dlt:
                funcVersion[i][x] = {
                    'changed': 1,
                    'state': DEL,
                }
        
        if len(update) > 0:
            for x in update:
                funcVersion[i][x] = {
                    'changed': 1,
                    'state': UPD,
                    'codes': deltaCodesMap.get(x)
                }
    return funcVersion

# def parse_args():
#     parser = argparse.ArgumentParser()
#     parser.add_argument('--train_num', type=int, default=15000, help='number of training data') 
#     parser.add_argument('--data', type=str, default='yahoo_15000.csv', help='data file path')
#     parser.add_argument('--result', type=str, default='result_yahoo.json', help='result file path')

#     # update records of optimization
#     parser.add_argument('--record', type=str, default='records_yahoo.json', help='record file path')
#     # content of updated function  
#     parser.add_argument('--function_dir', type=str, default='state_yahoo', help='function file path')
    
#     args = parser.parse_args()
#     return args

@eel.expose
def readLFsList():
    file_names = os.listdir(lfs_path)
    LFsList = []
    for (i,file_name) in enumerate(file_names):
        file_path = os.path.join(lfs_path, file_name)
        with open(file_path) as f: 
            texts = f.read()
            LFsList.append({
                'id': i,
                'name': file_name,
                'text': texts
            })
    return LFsList

def run():
    spam.base = train_number
    spam.data = pd.read_csv(data_file, header=0, delimiter='\t', encoding='unicode_escape')

    spam.df_train = spam.data[:train_number]
    spam.df_test = spam.data[train_number:]

    # with open('records_yahoo_test.json') as f:
    #     rowRecords = json.load(f)
    rowRecords = record
    if len(rowRecords) > 0:
        rowCodesVersion = get_func(len(rowRecords))
        funcVersions = parseRecord(rowRecords, rowCodesVersion)
        return compute(funcVersions)   

@eel.expose
def writeFile(data):
    global record, count
    # if data['id']==0 & len(record)>0:
    #     record = []
    result = []
    record.append({
        'id': data['id'],
        'add': [x['name'][:-4] for x in data['add']],
        'del': [x['name'][:-4] for x in data['del']],
        'update': [x['name'][:-4] for x in data['update']],
        "date": data['date']
    })

    file_path = states_path+str(data['id'])
    os.mkdir(file_path)

    for func in data['add']:
        with open(file_path+'/'+func['name'],'a+') as f:
            f.write(func['text'])
    
    for func in data['update']:
        with open(file_path+'/'+func['name'],'a+') as f:
            f.write(func['text'])
    
    try:
        result = run()
    except Exception as e:
        record.pop()
        shutil.rmtree(file_path)
        print(f"An error occurred: {e}")
        count = count - 1

    with open(record_file, 'w') as f:
        json.dump(record, f)
    return result

@eel.expose
def testState():
    return args.test

@eel.expose
def get_coords():
    doc_vector = np.load(embedding_file)
    return doc_vector.tolist()
 
@eel.expose
def num2portion(data):
    for level1 in data["children"]:
        level1_size = level1["size"]
        level1["originSize"] = level1["size"]
        level2_sum = sum([level2["size"] for level2 in level1["children"]])
        for level2 in level1["children"]:
            level2["originSize"] = level2["size"]
            level2["size"] = level2["size"] / level2_sum * level1_size
            level3_sum = sum([level3["size"] for level3 in level2["children"]])
            for level3 in level2["children"]:
                level3["originSize"] = level3["size"]
                level3["size"] = level3["size"] / level3_sum * level2["size"]
            del level2["size"]
        del level1["size"]
    return data



def update(testFlag):
    global states_path, result_file_path, lfs_path, data_file, train_number,embedding_file,record_file
    states_path = './data/state_spam/' if testFlag else './data/state_yahoo/'
    result_file_path = './data/result_spam.json' if testFlag else './data/result_yahoo.json'
    lfs_path = './data/LFs_spam' if testFlag else './data/LFs_yahoo'
    data_file = './data/spam.csv' if testFlag else './data/yahoo_15000.csv'
    train_number = 4000 if  testFlag else 15000 
    embedding_file = './data/spam.npy' if testFlag else './data/yahoo.npy'
    record_file = './data/records_spam.json' if testFlag else './data/records_yahoo.json'
    shutil.rmtree(states_path)
    os.mkdir(states_path)

if __name__ == '__main__': 
    parser = argparse.ArgumentParser()
    parser.add_argument('--test', type=int, default=False, help='number of training data')
    args = parser.parse_args()
    update(args.test)

eel.start('index.html', mode="chrome-app", port=8080)