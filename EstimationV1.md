# Project Estimation - CURRENT

Date: 05/05/2024

Version: 1

# Estimation approach

Consider the EZElectronics project in CURRENT version (as given by the teachers), assume that you are going to develop the project INDEPENDENT of the deadlines of the course, and from scratch

# Estimate by size

###

|                                                                                                         | Estimate |
| ------------------------------------------------------------------------------------------------------- | -------- |
| NC = Estimated number of classes to be developed                                                        | 10       |
| A = Estimated average size per class, in LOC                                                            | 150      |
| S = Estimated size of project, in LOC (= NC \* A)                                                       | 1500     |
| E = Estimated effort, in person hours (here use productivity 10 LOC per person hour)                    | 150      |
| C = Estimated cost, in euro (here use 1 person hour cost = 30 euro)                                     | 4500 €   |
| Estimated calendar time, in calendar weeks (Assume team of 4 people, 8 hours per day, 5 days per week ) | ~ 1 week |

E = 1500 / 10 = 37.5

Estimated calendar time:

**E = 150 person/hour -> 37,5 hours per person -> 4 days and 4h per person ~ 1 week**

# Estimate by product decomposition

###

| component name       | Estimated effort (person hours) |
| -------------------- | ------------------------------- |
| requirement document | 60                              |
| GUI prototype        | 15                              |
| design document      | 30                              |
| code                 | 120                             |
| unit tests           | 50                              |
| api tests            | 50                              |
| management documents | 50                              |

# Estimate by activity decomposition

###

| Activity name                             | Estimated effort (person hours) |
| ----------------------------------------- | ------------------------------- |
| **Requirements planning**                 |                                 |
| Stakeholders/Actors analysis              | 5                               |
| Requirements analysis                     | 10                              |
| Use cases analysis                        | 15                              |
| Diagrams design                           | 5                               |
| **GUI Design**                            |                                 |
| GUI (on paper) - prototype sketches       | 2                               |
| GUI (on Balsamiq) - first version         | 8                               |
| Project planning and resources assignment | 5                               |
| **Design**                                |                                 |
| Design analysis                           | 5                               |
| Design document                           | 5                               |
| Database definition                       | 5                               |
| **Implementation**                        |                                 |
| Develop code                              | 25                              |
| Developing models                         | 5                               |
| Developing controllers                    | 10                              |
| **TESTING**                               |                                 |
| Testing API                               | 9                               |
| Testing UI                                | 5                               |
| Testing of NF req                         | 5                               |

###

![gantt_diagram](./requirement_documents/v1/gantt_chart_v1.png)

# Summary

The difference, regarding the estimated duration, between the three techniques comes from the different approach in evaluating the distribution of efforts and resources over the available time, because putting the temporal relationships between the activities on an actual calendar, some activities can overlap and be done in parallel, but counting weekends enlarges the duration estimation.
Instead, the estimated effort is slightly different because the estimation by activity decomposition is a more detailed analysis of the WBS subactivities and then more person hours are considered with respect to the more general estimation by product, which considers only the deliverables.

|                                    | Estimated effort | Estimated duration |
| ---------------------------------- | ---------------- | ------------------ |
| estimate by size                   | 150ph            | about 1 week       |
| estimate by product decomposition  | 450ph            | about 2 weeks      |
| estimate by activity decomposition | 380ph            | about 3 weeks      |
