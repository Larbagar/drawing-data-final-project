

function changeMarker(markerMap, marker, change){
    if(markerMap.has(marker)){
        markerMap.set(marker, markerMap.get(marker) + change)
    }else{
        markerMap.set(marker, change)
    }
}

/**
 * @typedef {dataTypes.count | dataTypes.enrollment | dataTypes.capacity} dataType
 */

const dataTypes = {
    count: "count",
    enrollment: "enrollment",
    capacity: "capacity",
}

/**
 * @param dataset
 * @param {dataTypes.count | dataTypes.enrollment | dataTypes.capacity} dataType
 * @param {?Set<string>} subjects
 */
function generateDataMap(dataset, dataType, subjects = null) {
    const map = new Map()
    for(const subject of dataset) {
        if(subjects && !subjects.has(subject.code)){
            continue
        }
        for (const course of subject.courses) {
            for (const section of course.classes) {
                const
                    enrollment = parseInt(section.enrollment),
                    capacity = parseInt(section.capacity)
                for (const meeting of section.schedule.meetings) {
                    const
                        {start_time: startTimeStr, end_time: endTimeStr} = meeting,
                        [startTime, endTime] = [startTimeStr, endTimeStr].map(timeStr => {
                            const
                                [, hrStr, minStr, meridian] = timeStr.match(/(\d{2}):(\d{2}) (AM|PM)/),
                                [hr, min] = [hrStr, minStr].map(str => parseInt(str))
                            return (hr === 12 ? 0 : hr/24) + min/60/24 + (meridian === "AM" ? 0 : 1/2)
                        }),
                        days = meeting.days.length,
                        value = days * (
                            dataType === dataTypes.count ? 1 :
                                dataType === dataTypes.enrollment ? enrollment :
                                    dataType === dataTypes.capacity ? capacity :
                                        0
                        )
                    changeMarker(map, startTime, value)
                    changeMarker(map, endTime, -value)
                }
            }
        }
    }

    return map
}

function generateSortedKeys(dataMap) {
    return dataMap.keys().toArray().sort((a, b) => a - b)
}

function getMaxValue(dataMap, sortedKeys){
    let
        value = 0,
        max = 0
    for(const key of sortedKeys){
        value += dataMap.get(key)
        max = Math.max(max, value)
    }
    return max
}

class Graph {
    constructor(dataMap, color = "black", subjects = null, sortedKeys = generateSortedKeys(dataMap), maxValue = getMaxValue(dataMap, sortedKeys)){
        this.color = color
        this.dataMap = dataMap
        this.sortedKeys = sortedKeys
        this.maxValue = maxValue
        this.usedMaxValue = maxValue
        this.subjects = subjects

        this.animationDuration = 500
        this.overshootAmt = 2

        this.animationStartTime = performance.now()
        this.startPosition = new Map()
        for(const key of sortedKeys){
            this.startPosition.set(key, 0)
        }
    }

    animationData(){
        const
            animationTime = Math.min(1, (performance.now() - this.animationStartTime) / this.animationDuration),
            animationProgress = 2 * animationTime - animationTime ** 2 + this.overshootAmt * (animationTime - 2 * animationTime ** 2 + animationTime ** 3)

        return [animationTime, animationProgress]
    }

    continueAnimation(){
        return this.animationData()[0] < 1
    }

    * getCurrentPositions(){
        const [animationTime, animationProgress] = this.animationData()
        let pos = 0
        for(const key of this.sortedKeys){
            pos += this.startPosition.get(key) * (1 - animationProgress) + this.dataMap.get(key) / this.usedMaxValue * animationProgress
            yield [
                key,
                pos
            ]
        }
    }

    /**
     * Changes to the graph should be made after this function is called.
     */
    resetAnimation(){
        const [animationTime, animationProgress] = this.animationData()
        for(const [key, position] of this.getCurrentPositions()){
            this.startPosition.set(key,
                this.startPosition.get(key) * (1 - animationProgress) + this.dataMap.get(key) / this.usedMaxValue * animationProgress
            )
        }
        this.animationStartTime = performance.now()
    }
}

export {generateDataMap, generateSortedKeys, getMaxValue, dataTypes, Graph}