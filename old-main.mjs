import {f2025} from "./2025-26-fall-data.mjs"

const
    courseCountChange = new Map(),
    courseEnrollmentChange = new Map(),
    courseCapacity = new Map()

function changeMarker(markerMap, marker, change){
    if(markerMap.has(marker)){
        markerMap.set(marker, markerMap.get(marker) + change)
    }else{
        markerMap.set(marker, change)
    }
}



for(const subject of f2025){
    for(const course of subject.courses){
        for(const section of course.classes){
            const
                enrollment = parseInt(section.enrollment),
                capacity = parseInt(section.capacity)
            for(const meeting of section.schedule.meetings){
                const
                    {start_time: startTimeStr, end_time: endTimeStr} = meeting,
                    [startTime, endTime] = [startTimeStr, endTimeStr].map(timeStr => {
                        const
                            [, hrStr, minStr, meridian] = timeStr.match(/(\d{2}):(\d{2}) (AM|PM)/),
                            [hr, min] = [hrStr, minStr].map(str => parseInt(str))
                        return (hr === 12 ? 0 : hr) * 60 + min + 12 * 60 * (meridian === "AM" ? 0 : 1)
                    }),
                    days = meeting.days.length
                changeMarker(courseCountChange, startTime, days)
                changeMarker(courseCountChange, endTime, -days)
                changeMarker(courseEnrollmentChange, startTime, enrollment * days)
                changeMarker(courseEnrollmentChange, endTime, -enrollment * days)
                changeMarker(courseCapacity, startTime, capacity * days)
                changeMarker(courseCapacity, endTime, -capacity * days)
            }
        }
    }
}

const sortedKeys = courseCountChange.keys().toArray().sort((a, b) => a - b)

const startPositions = new Map()


let
    currentCount = 0,
    currentEnrollment = 0,
    currentCapacity = 0,
    maxCount = 0,
    maxEnrollment = 0,
    maxCapacity = 0
for(const key of sortedKeys){
    startPositions.set(key, 0)

    currentCapacity += courseCapacity.get(key)
    maxCapacity = Math.max(currentCapacity, maxCapacity)
    currentCount += courseCountChange.get(key)
    maxCount = Math.max(currentCount, maxCount)
    currentEnrollment += courseEnrollmentChange.get(key)
    maxEnrollment = Math.max(currentEnrollment, maxEnrollment)
}


let
    startMax = maxEnrollment,
    targetPositions = courseCountChange,
    targetMax = maxCount


const
    canvas = /** @type {HTMLCanvasElement} */ document.getElementById("big-graph"),
    ctx = canvas.getContext("2d"),
    graphedValueSelect = /** @type {HTMLSelectElement} */ document.getElementById("graphed-value")

const day = 24 * 60

function resize() {
    canvas.width = innerWidth * devicePixelRatio
    canvas.height = innerHeight * devicePixelRatio

}

addEventListener("resize", () => {
    resize()
    drawGraph(1) // TODO don't go to end of animation
})



resize()

const
    animationDuration = 500,
    overshootAmt = 2

let
    animationStartTime = performance.now(),
    currentAnimationRequest
function animate(){
    const
        animationTime = Math.min(1, (performance.now() - animationStartTime) / animationDuration),
        animationProgress = 2 * animationTime - animationTime ** 2 + overshootAmt * (animationTime - 2 * animationTime ** 2 + animationTime ** 3)

    drawGraph(animationProgress)

    if(animationTime < 1) {
        currentAnimationRequest = requestAnimationFrame(animate)
    }
}

animate()

function snapshotGraph(){
    const
        animationTime = Math.min(1, (performance.now() - animationStartTime) / animationDuration),
        animationProgress = 2 * animationTime - animationTime ** 2 + overshootAmt * (animationTime - 2 * animationTime ** 2 + animationTime ** 3)

    for(const key of sortedKeys){
        startPositions.set(
            key,
            startPositions.get(key) / startMax * (1 - animationProgress) + targetPositions.get(key) / targetMax * animationProgress,
        )
    }
    startMax = 1
}

function startAnimation(){
    animationStartTime = performance.now()
    cancelAnimationFrame(currentAnimationRequest)
    animate()
}

graphedValueSelect.addEventListener("change", e => {
    snapshotGraph()
    switch(graphedValueSelect.value){
        case "enrollment":
            targetPositions = courseEnrollmentChange
            targetMax = maxEnrollment
            break
        case "course count":
            targetPositions = courseCountChange
            targetMax = maxCount
            break
        default:
            throw "Unknown value to graph"
    }
    startAnimation()
})

function drawGraph(animationProgress){
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.lineWidth = 3
    ctx.resetTransform()
    ctx.scale(devicePixelRatio, devicePixelRatio)

    // ctx.shadowColor = "rgba(0, 0, 0, 0.5)"
    // ctx.shadowBlur = 8
    // ctx.shadowOffsetX = 4
    // ctx.shadowOffsetY = 4

    ctx.beginPath()
    ctx.moveTo(0, innerHeight - 24)
    let value = 0
    for(const key of sortedKeys){
        ctx.lineTo(key / day * innerWidth, (innerHeight - 24) * (1 - 0.7 * value))
        value += startPositions.get(key) / startMax * (1 - animationProgress) + targetPositions.get(key) / targetMax * animationProgress
        ctx.lineTo(key / day * innerWidth, (innerHeight - 24) * (1 - 0.7 * value))
    }
    ctx.lineTo(innerWidth, (innerHeight - 24) * (1 - 0.7 * value / maxEnrollment))

    ctx.stroke()
    // ctx.fill()

    ctx.shadowColor = "transparent"
    ctx.lineWidth = 1

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
}