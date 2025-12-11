import {f2025} from "./2025-26-fall-data.mjs"
import {dataTypes} from "./day-graph.mjs";

function setUpNotableThings() {

    const dataset = f2025

    const rows = []
    for (const subject of dataset) {
        let subjectEnrollment = 0
        let subjectInstructionTime = 0
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
                            return (hr === 12 ? 0 : hr / 24) + min / 60 / 24 + (meridian === "AM" ? 0 : 1 / 2)
                        }),
                        days = meeting.days.length
                        // value = days * (
                        //     dataType === dataTypes.count ? 1 :
                        //         dataType === dataTypes.enrollment ? enrollment :
                        //             dataType === dataTypes.capacity ? capacity :
                        //                 0
                        // )
                    subjectEnrollment += days * enrollment * (endTime - startTime)
                    subjectInstructionTime += days * (endTime - startTime)
                }
            }
        }
        rows.push([subject.name, subject.courses.length, subjectInstructionTime, subjectEnrollment, subjectEnrollment / subjectInstructionTime])
    }
    const totCount = rows.reduce((sum, data) => sum + data[1], 0)
    const totInstructionTime = rows.reduce((sum, data) => sum + data[2], 0)
    const totEnrollment = rows.reduce((sum, data) => sum + data[3], 0)
    rows.push(["Total", totEnrollment, totInstructionTime, totEnrollment, totEnrollment / totInstructionTime])

    function sortBy(n){

        rows.sort((a, b) => {
            if(typeof a[n] == "string"){
                return b[n] < a[n] ? -1 : 1
            }
            if(typeof a[n] == "number"){
                return b[n] - a[n]
            }
        })

        const subjectTable = document.getElementById("subject-table-body")

        while(subjectTable.lastChild){
            subjectTable.removeChild(subjectTable.lastChild)
        }

        for(const row of rows) {
            const tr = document.createElement("tr")
            for(let i = 0; i < row.length; i++){
                const datum = row[i]

                const td = document.createElement("td")
                let text
                if(i === 0){
                    text = datum
                }else if(i === 1){
                    text = datum.toFixed(0)
                }else{
                    text = datum.toFixed(2)
                    if(isNaN(datum)){
                        text = ""
                    }
                }
                td.append(document.createTextNode(text))

                tr.append(td)
            }

            subjectTable.append(tr)
        }
    }

    sortBy(3)

    document.getElementById("instruction-hours-header").onclick = () => {
        sortBy(2)
    }

    document.getElementById("cum-time-header").onclick = () => {
        sortBy(3)
    }


    document.getElementById("efficiency").onclick = () => {
        sortBy(4)
    }

    document.getElementById("course-count-header").onclick = () => {
        sortBy(1)
    }

    document.getElementById("course-name-header").onclick = () => {
        sortBy(0)
    }


}


export {setUpNotableThings}