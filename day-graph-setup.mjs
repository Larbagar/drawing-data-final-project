import {f2025} from "./2025-26-fall-data.mjs"
import {dataTypes, generateDataMap, generateSortedKeys, getMaxValue, Graph} from "./day-graph.mjs"


function setupDayGraph() {
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
        resetAnimations()
        updateAllGraph()

        if (!normalizeCheck.checked) {
            updateMaxValues()
        }
    })

    function updateAllGraph() {
        if (input.checked) {
            const
                dataMap = generateDataMap(f2025, valueToGraph()),
                graph = new Graph(dataMap, "black")
            graphs.set("all", graph)
        } else {
            graphs.delete("all")
        }
    }

    updateAllGraph()

    normalizeCheck.addEventListener("change", () => {
        resetAnimations()
        updateMaxValues()
    })

    function resetAnimations() {
        for (const [subject, graph] of graphs) {
            graph.resetAnimation()
        }
    }

    function updateMaxValues() {
        if (normalizeCheck.checked) {
            for (const [subject, graph] of graphs) {
                graph.usedMaxValue = graph.maxValue
            }
        } else {
            let max = 0
            for (const [subject, graph] of graphs) {
                max = Math.max(max, graph.maxValue)
            }

            for (const [subject, graph] of graphs) {
                graph.usedMaxValue = max
            }
        }
    }

    let hue = 256 * Math.random()
    for (const subject of f2025) {
        const input = document.createElement("input")
        input.type = "checkbox"

        const text = document.createTextNode(subject.name)
        const li = document.createElement("li")
        li.appendChild(input)
        li.appendChild(text)

        subjectList.appendChild(li)

        input.addEventListener("change", e => {
            resetAnimations()
            if (input.checked) {
                hue += 256 * phi
                const
                    color = `hsl(${Math.floor(hue % 256)}, 100%, 40%)`,
                    dataMap = generateDataMap(f2025, valueToGraph(), new Set([subject.code])),
                    graph = new Graph(dataMap, color, new Set([subject.code]))
                graphs.set(subject.code, graph)
                li.style.color = color
            } else {
                graphs.delete(subject.code)
                li.style.color = "black"
            }
            if (!normalizeCheck.checked) {
                updateMaxValues()
            }
        })
    }

    function resize() {
        const dimensions = canvas.getBoundingClientRect()
        canvas.width = dimensions.width * devicePixelRatio
        canvas.height = dimensions.height * devicePixelRatio

    }

    addEventListener("resize", () => {
        resize()
    })

    resize()

    const
        dataMap = new Map(),
        fullDetailKeys = generateSortedKeys(dataMap)

// graph = new Graph(dataMap, null, getMaxValue(dataMap, sortedKeys), fullDetailKeys)

    /**
     * @returns {dataType}
     */
    function valueToGraph() {
        switch (graphedValueSelect.value) {
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

    function *zip (...iterables){
        let iterators = iterables.map(i => i[Symbol.iterator]() )
        while (true) {
            let results = iterators.map(iter => iter.next() )
            if (results.some(res => res.done) ) return
            else yield results.map(res => res.value )
        }
    }

    function updateGraphedValue() {
        for (const [subject, graph] of graphs) {
            graph.resetAnimation()
            if(graphedValueSelect.value === "enrollment/capacity"){
                const
                    enrollmentDataMap = generateDataMap(f2025, dataTypes.enrollment, graph.subjects),
                    capacityDataMap = generateDataMap(f2025, dataTypes.capacity, graph.subjects),
                    relativeCapacityDataMap = new Map()
                for(const key of graph.sortedKeys){
                    relativeCapacityDataMap.set(key,
                        enrollmentDataMap.get(key) / capacityDataMap.get(key)
                    )
                }
                graph.dataMap = relativeCapacityDataMap
            }else {
                graph.dataMap = generateDataMap(f2025, valueToGraph(), graph.subjects)
            }
            graph.maxValue = getMaxValue(graph.dataMap, graph.sortedKeys)
        }
        updateMaxValues()
    }

    updateGraphedValue()

    graphedValueSelect.addEventListener("change", () => {
        resetAnimations()
        updateGraphedValue()
    })

    function drawGraph() {
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        ctx.resetTransform()

        ctx.strokeStyle = "black"
        ctx.shadowColor = "transparent"
        ctx.lineWidth = 1 * devicePixelRatio

        ctx.beginPath()
        ctx.moveTo(0, canvas.height - 24 * devicePixelRatio)
        ctx.lineTo(canvas.width, canvas.height - 24 * devicePixelRatio)
        ctx.stroke()
        ctx.font = `${20 * devicePixelRatio}px serif`

        ctx.beginPath()
        for (let i = 8; i <= 23; i += 1) {
            ctx.moveTo((i - 8) / (24 - 9) * canvas.width, 0)
            ctx.lineTo((i - 8) / (24 - 9) * canvas.width, canvas.height)
            ctx.fillText(`${i}:00`, (i - 8) / (24 - 9) * canvas.width + 2 * devicePixelRatio, canvas.height - 4 * devicePixelRatio)
        }
        ctx.stroke()

        ctx.lineWidth = 3 * devicePixelRatio

        for (const [subject, graph] of graphs) {
            ctx.strokeStyle = graph.color
            ctx.beginPath()

            ctx.moveTo(0, canvas.height - 24 * devicePixelRatio)
            let pos = 0
            for (const [key, newPos] of graph.getCurrentPositions()) {
                ctx.lineTo(canvas.width * (key - 8 / 24) * 24 / (24 - 9), (canvas.height - 24 * devicePixelRatio) * (1 - 0.7 * pos))
                pos = newPos
                ctx.lineTo(canvas.width * (key - 8 / 24) * 24 / (24 - 9), (canvas.height - 24 * devicePixelRatio) * (1 - 0.7 * pos))
            }
            ctx.lineTo(canvas.width, canvas.height - 24 * devicePixelRatio - pos)

            ctx.stroke()
        }

        requestAnimationFrame(drawGraph)
    }

    drawGraph()
}

export {setupDayGraph}