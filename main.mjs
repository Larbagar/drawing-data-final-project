import {f2025} from "./2025-26-fall-data.mjs"
import {dataTypes, generateDataMap, generateSortedKeys, getMaxValue, Graph} from "./day-graph.mjs"

const phi = (1 + Math.sqrt(5)) / 2

const
    canvas = /** @type {HTMLCanvasElement} */ document.getElementById("big-graph"),
    ctx = canvas.getContext("2d"),
    graphedValueSelect = /** @type {HTMLSelectElement} */ document.getElementById("graphed-value"),
    subjectList = document.getElementById("subject-list"),
    normalizeCheck = /** @type {HTMLInputElement} */ document.getElementById("normalize")

/** @type {Map<string, Graph>} */
const graphs = new Map()


const input = document.createElement("input")
input.type = "checkbox"
input.checked = true

const text = document.createTextNode("All")
const li = document.createElement("li")
li.appendChild(input)
li.appendChild(text)

subjectList.appendChild(li)

input.addEventListener("change", e => {
    updateAllGraph()

    if(!normalizeCheck.checked) {
        updateMaxValues()
    }
})

function updateAllGraph(){
    if(input.checked){
        const
            dataMap = generateDataMap(f2025, valueToGraph()),
            graph = new Graph(dataMap, "black")
        graphs.set("all", graph)
    }else{
        graphs.delete("all")
    }
}

updateAllGraph()

normalizeCheck.addEventListener("change", updateMaxValues)

function updateMaxValues(){
    if(normalizeCheck.checked){
        for(const [subject, graph] of graphs){
            graph.resetAnimation()
            graph.usedMaxValue = graph.maxValue
        }
    }else{
        let max = 0
        for(const [subject, graph] of graphs){
            max = Math.max(max, graph.maxValue)
        }

        for(const [subject, graph] of graphs){
            graph.resetAnimation()
            graph.usedMaxValue = max
        }
    }
}

let hue = 256 * Math.random()
for(const subject of f2025){
    const input = document.createElement("input")
    input.type = "checkbox"

    const text = document.createTextNode(subject.name)
    const li = document.createElement("li")
    li.appendChild(input)
    li.appendChild(text)

    subjectList.appendChild(li)

    input.addEventListener("change", e => {
        if(input.checked){
            hue += 256 * phi
            const
                color = `hsl(${Math.floor(hue % 256)}, 100%, 40%)`,
                dataMap = generateDataMap(f2025, valueToGraph(), new Set([subject.code])),
                graph = new Graph(dataMap, color, new Set([subject.code]))
            graphs.set(subject.code, graph)
            li.style.color = color
        }else{
            graphs.delete(subject.code)
            li.style.color = "black"
        }
        if(!normalizeCheck.checked) {
            updateMaxValues()
        }
    })
}

function resize() {
    canvas.width = innerWidth * devicePixelRatio
    canvas.height = innerHeight * devicePixelRatio

}

addEventListener("resize", () => {
    resize()
})

resize()

const
    dataMap = generateDataMap(f2025, dataTypes.enrollment),
    fullDetailKeys = generateSortedKeys(dataMap)
    // graph = new Graph(dataMap, null, getMaxValue(dataMap, sortedKeys), fullDetailKeys)

/**
 * @returns {dataType}
 */
function valueToGraph(){
    switch(graphedValueSelect.value){
        case "enrollment":
            return dataTypes.enrollment
        case "course count":
            return dataTypes.count
        case "capacity":
            return dataTypes.capacity
        default:
            throw "Unknown value to graph"
    }
}

function updateGraphedValue(){
    for(const [subject, graph] of graphs){
        graph.resetAnimation()
        graph.dataMap = generateDataMap(f2025, valueToGraph(), graph.subjects)
        graph.maxValue = getMaxValue(graph.dataMap, graph.sortedKeys)
    }
}

updateGraphedValue()

graphedValueSelect.addEventListener("change", updateGraphedValue)

function drawGraph(){
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.resetTransform()
    ctx.scale(devicePixelRatio, devicePixelRatio)

    ctx.strokeStyle = "black"
    ctx.shadowColor = "transparent"
    ctx.lineWidth = 1

    ctx.beginPath()
    ctx.moveTo(0, innerHeight - 24)
    ctx.lineTo(innerWidth, innerHeight - 24)
    ctx.stroke()
    ctx.font = `${20}px serif`

    ctx.beginPath()
    for(let i = 0; i <= 24; i += 2){
        ctx.moveTo(i / 24 * innerWidth, 0)
        ctx.lineTo(i / 24 * innerWidth, innerHeight)
        ctx.fillText(`${i}:00`, i / 24 * innerWidth + 2, innerHeight - 4)
    }
    ctx.stroke()

    ctx.lineWidth = 3

    for(const [subject, graph] of graphs) {
        ctx.strokeStyle = graph.color
        ctx.beginPath()

        ctx.moveTo(0, innerHeight - 24)
        let pos = 0
        for (const [key, newPos] of graph.getCurrentPositions()) {
            ctx.lineTo(innerWidth * key, (innerHeight - 24) * (1 - 0.7 * pos))
            pos = newPos
            ctx.lineTo(innerWidth * key, (innerHeight - 24) * (1 - 0.7 * pos))
        }
        ctx.lineTo(innerWidth, innerHeight - 24 - pos)

        ctx.stroke()
    }

    requestAnimationFrame(drawGraph)
}

drawGraph()