import json
import eel
import os
import spam
import argparse
import pandas as pd

# eel.init('web')
ADD = 0
UPD = 1
DEL = 2
KEEP = 3

global args

# get function names from state directory
def get_func(l):
    func = []
    for i in range(l):
        state = []
        path = '{}/{}/'.format(args.function_dir, i)
        files = os.listdir(path)
        for file in files:
            with open(path+file) as f:
                state.append(f.read())
        func.append(state)
    return func

# get results of the lfs
def compute(funcVersions):
    result = []
    for (vid, version) in enumerate(funcVersions):
        if vid != 0:
            result.append(spam.apply_lfs(version, vid, funcVersions[vid-1]))
        else:
            result.append(spam.apply_lfs(version, vid))
    with open(args.result, 'w') as f:
        json.dump(result, f)

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

def parse_args():
    parser = argparse.ArgumentParser()
    # parser.add_argument('--data', type=str, default='yahoo_15000.csv', help='data file path')
    # parser.add_argument('--train_num', type=int, default=15000, help='number of training data')
    # parser.add_argument('--record', type=str, default='records_yahoo.json', help='record file path')
    # parser.add_argument('--function_dir', type=str, default='state_yahoo', help='function file path')
    # parser.add_argument('--result', type=str, default='result_yahoo.json', help='result file path')

    parser.add_argument('--data', type=str, default='spam.csv', help='data file path')
    parser.add_argument('--train_num', type=int, default=4000, help='number of training data')
    parser.add_argument('--record', type=str, default='records.json', help='record file path')
    parser.add_argument('--function_dir', type=str, default='spam_state', help='function file path')
    parser.add_argument('--result', type=str, default='result_spam.json', help='result file path')
    
    args = parser.parse_args()
    return args

if __name__ == '__main__':
    args = parse_args()
    spam.base = args.train_num
    spam.data = pd.read_csv(args.data, header=0, delimiter='\t', encoding='unicode_escape')

    spam.df_train = spam.data[:args.train_num]
    spam.df_test = spam.data[args.train_num:]
    

    with open(args.record) as f:
        rowRecords = json.load(f)
        rowCodesVersion = get_func(len(rowRecords))
        funcVersions = parseRecord(rowRecords, rowCodesVersion)
        compute(funcVersions)

# eel.start('index.html', mode="chrome-app")