import pandas as pd
import numpy as np
import re
# from pandas.core.frame import DataFrame
from snorkel.labeling import labeling_function
from snorkel.labeling import PandasLFApplier
from snorkel.labeling import LFAnalysis
# from snorkel.preprocess.nlp import SpacyPreprocessor
from snorkel.labeling.model import LabelModel
from snorkel.preprocess import preprocessor
from textblob import TextBlob
from sklearn.metrics import f1_score, precision_score, recall_score
# 任何python第三方库
import collections

lfs = []
records = []
funcStrs = []
lfs_names = []

#显示所有列
pd.set_option('display.max_columns', None)
#显示所有行
pd.set_option('display.max_rows', None)
#设置value的显示长度为100，默认为50
pd.set_option('max_colwidth',100)


global data, df_train, df_test, base

'''
Data for Yahoo! Answers
'0': Society & Culture
'1': Science & Mathematics
'2': Health
'3': Education & Reference
'4': Computers & Internet
'5': Sports
'''

SOCIAL = 0
SCIENCE = 1
HEALTH = 2
EDUCATION = 3
COMPUTER = 4
SPORTS = 5

ABSTAIN = -1
HAM = 0
SPAM = 1

ADD = 0
UPD = 1
DEL = 2
KEEP = 3

@preprocessor(memoize=True)
def textblob_sentiment(x):
    scores = TextBlob(x.text)
    x.polarity = scores.sentiment.polarity
    x.subjectivity = scores.sentiment.subjectivity
    return x


def get_func_name(code):
    return code.split('def ')[1].split('(x)')[0]

# calculate F1 score
def getPerformance(preds):
    groundTruth = []
    predicts = []
    for pred, label in zip(preds, df_test['label']):
        if pred != -1:
            groundTruth.append(label)
            predicts.append(pred)
    f1 = f1_score(groundTruth, predicts, average=None)
    perf = [float('{:.3f}'.format(i)) for i in f1.tolist()]
    return perf

# calculate coverage
def getCoverage(preds):
    count= [0,0,0,0,0,0]
    for pred in preds:
        if pred != -1:
            count[pred] = count[pred]+1
    count = [float('{:.3f}'.format(i/15000)) for i in count]
    return count


def apply_lfs(funcs, id, lastFuncs = []):
    lfs = []
    names = []
    for func in funcs:
        if funcs[func]['state'] != DEL:
            funcCode = funcs[func]['codes']
            try:
                exec(funcCode)
            except Exception as e:
                # Raise the exception to propagate it
                raise e

            name = get_func_name(funcCode)
            lfs.append(eval(name))
            names.append(name)

    applier = PandasLFApplier(lfs=lfs)
    L_train = applier.apply(df=df_train)
    L_test = applier.apply(df=df_test)
    label_model = LabelModel(cardinality=6, verbose=True)
    label_model.fit(L_train=L_train, n_epochs=500, log_freq=100, seed=123)
    preds_train = label_model.predict(L_train)
    preds_test = label_model.predict(L_test)
    performance = getPerformance(preds_test)
    weights = label_model.get_weights()

    coverage = getCoverage(preds_train)
    # print(type(LFAnalysis(L=L_train, lfs=lfs).lf_summary()))
    print(LFAnalysis(L=L_train, lfs=lfs).lf_summary())
    print('precision----------------------------')
    print(performance)
    print('coverage----------------------')
    print(coverage)
    print('total coverage----------------------')
    print(float('{:.3f}'.format(sum(coverage))))
 

    analysis = LFAnalysis(L=L_train, lfs=lfs)
    for (i, coverage) in enumerate(list(analysis.lf_coverages())):
        funcs[names[i]]['coverage'] = round(coverage,5)

    for (i, apply_labels) in enumerate(L_test.T):
        totalCount = 0
        rightCount = 0
        # calculate accuracy by class
        class_count = collections.defaultdict(int)
        class_right = collections.defaultdict(int)
        for (j, apply_label) in enumerate(apply_labels):
            if apply_label != -1:
                totalCount = totalCount + 1
                class_count[apply_label] += 1
                if df_test['label'][base+j] == apply_label:
                    rightCount = rightCount + 1
                    class_right[apply_label] += 1
        if totalCount != 0:
            funcs[names[i]]['accuracy'] = {'avg':round(rightCount/totalCount,3)}
        else:
            funcs[names[i]]['accuracy'] = {'avg':'nan'}
        for class_ in class_count:
            funcs[names[i]]['accuracy'][str(class_)] = round(class_right[class_]/class_count[class_],3)
    return {
        'model_performance': performance,
        'label_test':  preds_test.tolist(),
        'label_train': preds_train.tolist(),
        'apply_test': L_test.tolist(),
        'apply_train': L_train.tolist(),
        'funcs_info': funcs,
        'lfs_name': names,
        'weights': weights.tolist(),
    }