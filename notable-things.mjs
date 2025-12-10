import {f2025} from "./2025-26-fall-data.mjs"
import {dataTypes} from "./day-graph.mjs";

function setUpNotableThings() {

    const dataset = f2025

    const rows = []
    for (const subject of dataset) {
        let subjectEnrollment = 0
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
                }
            }
        }
        rows.push([subject.name, subjectEnrollment, subject.courses.length])
    }
    const totEnrollment = rows.reduce((sum, data) => sum + data[1], 0)
    const totCount = rows.reduce((sum, data) => sum + data[2], 0)
    rows.push(["Total", totEnrollment, totCount])

    function sortBy(n){
        rows.sort((a, b) => b[n] - a[n])

        const subjectTable = document.getElementById("subject-table-body")

        while(subjectTable.lastChild){
            subjectTable.removeChild(subjectTable.lastChild)
        }

        for(const row of rows) {
            const tr = document.createElement("tr")
            for(const datum of row){
                const td = document.createElement("td")
                let text
                if(typeof datum == "number"){
                    text = document.createTextNode(datum.toFixed(2))
                }else{
                    text = document.createTextNode(datum)
                }
                td.append(text)

                tr.append(td)
            }

            subjectTable.append(tr)
        }
    }

    sortBy(1)

    document.getElementById("cum-time-header").onclick = () => {
        sortBy(1)
    }

    document.getElementById("course-count-header").onclick = () => {
        sortBy(2)
    }


}


export {setUpNotableThings}