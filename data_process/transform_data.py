from datasets import load_dataset



trec_qc = load_dataset("Brendan/yahoo_answers")

train_set = trec_qc["train"]


# filter out label > 5
train_set = train_set.filter(lambda x: x['label'] < 6)
# get 21200 samples, shuffle
train_set = train_set.shuffle().select(range(21200))

train_set.to_csv('yahoo.csv', sep='\t', index=False)