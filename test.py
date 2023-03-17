SOCIAL = 0
SCIENCE = 1
HEALTH = 2
EDUCATION = 3
COMPUTER = 4
SPORTS = 5

ABSTAIN = -1

test = "do you think bruce  lee (if alive)can beat heavy weight champion  fedor?   wtf? are all of those people stupid? fedor is ridicously fast for his size, he is fast or even faster than many light weights out there. also what are all those crap ""secret illegal techniques"" everyone is talking about? so far no one will dare to answer those questions.  beside that if someone beat other person under rule, that person will also win the fight in street 99 out of 100 time. beside as guy above me describe, if lee got taken down and ground and pound, lee better have really good insurance company. it's harder to avoid take down than avoid strikes especially if you don't know much about grappling."

def company(x):
    import re
    if re.search(r"company", x.lower(), re.IGNORECASE):
        if 'insurance' in x.lower().split(' '):
            return HEALTH
        if re.search("server|software", x.lower()):
            return COMPUTER
    return ABSTAIN

print(company(test))