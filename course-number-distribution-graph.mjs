import {f2025} from "./2025-26-fall-data.mjs";

function setUpCourseNumberDistributionGraph(){
    const dataset = f2025





    /**
     * @param {Map<number>} map
     * @param key
     */
    function incrementMap(map, key){
        if(map.has(key)){
            map.set(key, map.get(key) + 1)
        }else{
            map.set(key, 1)
        }
    }

    const courseNumberMap = new Map()
    let maxCode = 0
    let minCode = Infinity
    for (const subject of dataset) {
        let subjectEnrollment = 0
        for (const course of subject.courses) {
            let [, code] = course.catalog_number.match(/(\d+)/)
            if(code > 1000){
                code -= 300
            }
            maxCode = Math.max(maxCode, code)
            minCode = Math.min(minCode, code)

            incrementMap(courseNumberMap, parseInt(code))
        }
    }

    let maxCount = 0
    for(const [code, count] of courseNumberMap){
        maxCount = Math.max(maxCount, count)
    }


    console.log(Array.from(courseNumberMap).sort((a, b) => a[1] - b[1]))


    const
        graph = /** @type {HTMLCanvasElement} */ document.getElementById("course-number-distribution-graph"),
        ctx = graph.getContext("2d")



    function resize() {
        const dimensions = graph.getBoundingClientRect()
        graph.width = dimensions.width * devicePixelRatio
        graph.height = dimensions.height * devicePixelRatio

    }

    addEventListener("resize", () => {
        resize()
    })

    resize()


    function render(){

        ctx.beginPath()
        ctx.lineWidth = 1 * devicePixelRatio
        for(const [code, count] of courseNumberMap){
            ctx.moveTo((0.1 + 0.8 * (code - minCode) / (maxCode - minCode)) * graph.width, graph.height)
            ctx.lineTo((0.1 + 0.8 * (code - minCode) / (maxCode - minCode)) * graph.width, (1 - 0.8 * count / maxCount) * graph.height)
        }

        ctx.stroke()

        requestAnimationFrame(render)
    }

    render()
}

export {setUpCourseNumberDistributionGraph}