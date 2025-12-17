import {setupDayGraph} from "./day-graph-setup.mjs"
import {setUpNotableThings} from "./notable-things.mjs"
import {setUpCourseNumberDistributionGraph} from "./course-number-distribution-graph.mjs"
import {f2025} from "./2025-26-fall-data.mjs";

window.f2025 = f2025
setupDayGraph()
setUpNotableThings()
setUpCourseNumberDistributionGraph()