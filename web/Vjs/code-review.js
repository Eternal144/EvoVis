let el = document.getElementById('code-review-container')
// let code = "@labeling_function()\ndef sex(x):\n\tsex_str = ['sex']\n\tfor s in sex_str:\n\t\tif s in x.text.lower():\n\t\t\treturn SPAM\n\treturn ABSTAIN \n\n@labeling_function()\ndef sex(x):\n\tsex_str = ['sex']\n\tfor s in sex_str:\n\t\tif s in x.text.lower():\n\t\t\treturn SPAM\n\treturn ABSTAIN \n\n@labeling_function()\ndef sex(x):\n\tsex_str = ['sex']\n\tfor s in sex_str:\n\t\tif s in x.text.lower():\n\t\t\treturn SPAM\n\treturn ABSTAIN"
let rawCodeList = ''
let myCodeMirror = CodeMirror.fromTextArea(el, {
    mode: 'python', // 语言模式
    keyMap: 'sublime', // 快键键风格
    lineNumbers: true, // 显示行号
    smartIndent: true, // 智能缩进
    indentUnit: 4, // 智能缩进单位为4个空格长度
    indentWithTabs: true, // 使用制表符进行智能缩进
    lineWrapping: true, // 
    // 在行槽中添加行号显示器、折叠器、语法检测器
    gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter', 'CodeMirror-lint-markers'], 
    foldGutter: true, // 启用行槽中的代码折叠
    // autofocus: true, // 自动聚焦
    matchBrackets: true, // 匹配结束符号，比如']、}'
    autoCloseBrackets: true, // 自动闭合符号
    styleActiveLine: true, // 显示选中行的样式
});

// // 编辑器按键监听
// myCodeMirror.on('keypress', function() {
//     // 显示智能提示
//     myCodeMirror.showHint(); // 注意，注释了CodeMirror库中show-hint.js第131行的代码（阻止了代码补全，同时提供智能提示）
// });

// myCodeMirror.setOption('value', code)
// let codeDiffPattern =  false

const updateCodeByName = (name)=>{
    let coedes = funcInfo[selectedVersion][name].codes
    myCodeMirror.setOption('value', coedes)
}

const updateCodeByCodes = (codes)=>{
    myCodeMirror.setOption('value', codes)
}

const updateCodeByVersion = (vid)=>{
    if(!codesStore[vid] ){
        codesStore[vid] = getCodes(vid)
    }
    myCodeMirror.setOption('value', codesStore[vid])
}

const getCodes = (vid)=>{
    let funcList = Object.keys(funcInfo[vid]).map((key)=>{
        return funcInfo[vid][key].codes
    })
    return funcList.join('\n\n').trim()
}

const resetCode = ()=>{
    updateCodeByVersion(selectedVersion)
}