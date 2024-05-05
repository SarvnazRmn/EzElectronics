# Project Estimation - FUTURE

Date: 05/05/2024

Version: 2

# Estimation approach

Consider the EZElectronics project in FUTURE version (as proposed by your team in requirements V2), assume that you are going to develop the project INDEPENDENT of the deadlines of the course, and from scratch (not from V1)

# Estimate by size

###

|                                                                                                         | Estimate |
| ------------------------------------------------------------------------------------------------------- | -------- |
| NC = Estimated number of classes to be developed                                                        | 20       |
| A = Estimated average size per class, in LOC                                                            | 200      |
| S = Estimated size of project, in LOC (= NC \* A)                                                       | 4000     |
| E = Estimated effort, in person hours (here use productivity 10 LOC per person hour)                    | 400      |
| C = Estimated cost, in euro (here use 1 person hour cost = 30 euro)                                     | 12000    |
| Estimated calendar time, in calendar weeks (Assume team of 4 people, 8 hours per day, 5 days per week ) | 2.5      |

# Estimate by product decomposition

###

| component name       | Estimated effort (person hours) |
| -------------------- | ------------------------------- |
| requirement document | 70                              |
| GUI prototype        | 20                              |
| design document      | 40                              |
| code                 | 110                             |
| unit tests           | 50                              |
| api tests            | 50                              |
| management documents | 30                              |

# Estimate by activity decomposition

###

| Activity name                             | Estimated effort (person hours) |
| ----------------------------------------- | ------------------------------- |
| **Requirements planning**                 |                                 |
| Stakeholders/Actors analysis              | 10                              |
| Requirements analysis                     | 20                              |
| Use cases analysis                        | 30                              |
| Diagrams design                           | 10                              |
| **GUI Design**                            |                                 |
| GUI (on paper) - prototype sketches       | 5                               |
| GUI (on Balsamiq) - first version         | 15                              |
| Project planning and resources assignment | 10                              |
| **Design**                                |                                 |
| Design analysis                           | 15                              |
| Design document                           | 25                              |
| Database definition                       | 10                              |
| **Implementation**                        |                                 |
| Develop code                              | 65                              |
| Developing models                         | 20                              |
| Developing controllers                    | 25                              |
| **TESTING**                               |                                 |
| Testing API                               | 40                              |
| Testing UI                                | 30                              |
| Testing of NF req                         | 50                              |

###

![gantt_diagram](/requirements_documents/v2/gantt_chart_v2.png)

# Summary

The difference, regarding the estimated duration, between the first two techniques and the third one comes from the different approach in evaluating the distribution of efforts and resources over the available time, because putting the temporal relationships between the activities on an actual calendar, some activities can overlap and be done in parallel, but counting weekends enlarges the duration estimation.
Instead, the estimated effort is slightly different because the estimation by activity decomposition is a more detailed analysis of the WBS subactivities and then more person hours are considered with respect to the more general estimation by product, which considers only the deliverables.

|                                    | Estimated effort | Estimated duration |
| ---------------------------------- | ---------------- | ------------------ |
| estimate by size                   | 400ph            | about 2 weeks      |
| estimate by product decomposition  | 370ph            | about 2 weeks      |
| estimate by activity decomposition | 400ph            | about 3 weeks      |
