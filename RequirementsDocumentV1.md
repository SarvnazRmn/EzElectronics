# Requirements Document - current EZElectronics

Date:

Version: V1 - description of EZElectronics in CURRENT form (as received by teachers)

| Version number | Change |
| :------------: | :----: |
|                |        |

# Contents

- [Requirements Document - current EZElectronics](#requirements-document---current-ezelectronics)
- [Contents](#contents)
- [Informal description](#informal-description)
- [Stakeholders](#stakeholders)
- [Context Diagram and interfaces](#context-diagram-and-interfaces)
  - [Context Diagram](#context-diagram)
  - [Interfaces](#interfaces)
- [Stories and personas](#stories-and-personas)
- [Functional and non functional requirements](#functional-and-non-functional-requirements)
  - [Functional Requirements](#functional-requirements)
  - [Non Functional Requirements](#non-functional-requirements)
- [Use case diagram and use cases](#use-case-diagram-and-use-cases)
  - [Use case diagram](#use-case-diagram)
    - [Use case 1, UC1](#use-case-1-uc1)
      - [Scenario 1.1](#scenario-11)
      - [Scenario 1.2](#scenario-12)
      - [Scenario 1.x](#scenario-1x)
    - [Use case 2, UC2](#use-case-2-uc2)
    - [Use case x, UCx](#use-case-x-ucx)
- [Glossary](#glossary)
- [System Design](#system-design)
- [Deployment Diagram](#deployment-diagram)

# Informal description

EZElectronics (read EaSy Electronics) is a software application designed to help managers of electronics stores to manage their products and offer them to customers through a dedicated website. Managers can assess the available products, record new ones, and confirm purchases. Customers can see available products, add them to a cart and see the history of their past purchases.

# Stakeholders

| Stakeholder name  |                    Description                    |
| :---------------: | :-----------------------------------------------: |
|     Customer      |                                                   |
|    Shop owner     |                Manager of the shop                |
| Product companies | Company producing the product sell on the website |
|    Tech admin     |               Admin of the website                |
|    Competitors    |       Website such as Amazon, MediaWorld..        |
|  Control Team ??  |                  Check stock ??                   |

?? Notes : do they put ads ?

# Context Diagram and interfaces

## Context Diagram - Gino

\<Define here Context diagram using UML use case diagram>

\<actors are a subset of stakeholders>

## Interfaces - Ale Sarv Laura

\<describe here each interface in the context diagram>

\<GUIs will be described graphically in a separate document>

|   Actor   | Logical Interface | Physical Interface |
| :-------: | :---------------: | :----------------: |
| Actor x.. |                   |                    |

# Stories and personas - Everybody

\<A Persona is a realistic impersonation of an actor. Define here a few personas and describe in plain text how a persona interacts with the system>

\<Persona is-an-instance-of actor>

\<stories will be formalized later as scenarios in use cases>

# Functional and non functional requirements

## Functional Requirements - Ale

\<In the form DO SOMETHING, or VERB NOUN, describe high level capabilities of the system>

\<they match to high level use cases>

## Functional Requirements

|  ID   | Description                                                                                |
| :---: | :----------------------------------------------------------------------------------------- |
| _FR1_ | User Management                                                                            |
| FR1.1 | Creates new User                                                                           |
| FR1.2 | Retrieves all users                                                                        |
| FR1.3 | Retrieves all users with a specific role                                                   |
| FR1.4 | Retrieves specific user                                                                    |
| FR1.5 | Deletes specific user                                                                      |
| _FR2_ | User Authentication                                                                        |
| FR2.1 | User Log_in/Log_out                                                                        |
| _FR3_ | Cart Management                                                                            |
| FR3.1 | Retrieves the cart for a specific user                                                     |
| FR3.2 | Adds a product to the user's cart                                                          |
| FR3.3 | Retrieves all carts/orders for a specific customer                                         |
| FR3.4 | Removes a product from the user's cart                                                     |
| FR3.5 | Deletes a specific cart                                                                    |
| _FR4_ | Product Management                                                                         |
| FR4.1 | Registers the arrival of a new set of products                                             |
| FR4.2 | Registers the arrival of a single new product                                              |
| FR4.3 | Marks a product as sold                                                                    |
| FR4.4 | Returns all products, or only the ones that have been sold or not sold                     |
| FR4.5 | Returns all products of a specific model, or only the ones that have been sold or not sold |
| FR4.6 | Deletes a specific product                                                                 |

## Non Functional Requirements - Ale

\<Describe constraints on functional requirements>

|   ID    | Type (efficiency, reliability, ..) |                                                          Description                                                           |   Refers to   |
| :-----: | :--------------------------------: | :----------------------------------------------------------------------------------------------------------------------------: | :-----------: |
|  NFR1   |             Efficiency             |                                   All functions on the website should take less than 0.1 sec                                   | All functions |
|  NFR2   |             Usability              |              The Manager of the store should be able to use the website with no training in less than 15 minutes               |  FR1 and FR4  |
|  NFR3   |             Usability              |                           The Client of the store should be able to use the website with no training                           |  FR2 and FR3  |
|  NFR4   |            Portability             | The website should be compatible with different browsers (Chrome, Mozilla, Safari, Edge, Opera...) releases from at least 2023 | All functions |
| NFRx .. |                                    |                                                                                                                                |               |

# Use case diagram and use cases

## Use case diagram - Laura

\<define here UML Use case diagram UCD summarizing all use cases, and their relationships>

\<next describe here each use case in the UCD>

### Use case 1, UC1

| Actors Involved  |                                                                      |
| :--------------: | :------------------------------------------------------------------: |
|   Precondition   | \<Boolean expression, must evaluate to true before the UC can start> |
|  Post condition  |  \<Boolean expression, must evaluate to true after UC is finished>   |
| Nominal Scenario |         \<Textual description of actions executed by the UC>         |
|     Variants     |                      \<other normal executions>                      |
|    Exceptions    |                        \<exceptions, errors >                        |

### UC1 - Use Case 1: Add product to cart

| Actors Involved  |                          Customer                           |
| :--------------: | :---------------------------------------------------------: |
|   Precondition   | The user must be authenticated and a have "customer" (role) |
|  Post condition  |        The cart should contain the requested product        |
| Nominal Scenario |      The user add the product successfully to his cart      |
|     Variants     |           The user add **n** product to his cart            |
|    Exceptions    |   The product is sold out <br> The product does not exist   |

##### Scenario 1.1

\<describe here scenarios instances of UC1>

\<a scenario is a sequence of steps that corresponds to a particular execution of one use case>

\<a scenario is a more formal description of a story>

\<only relevant scenarios should be described>

|  Scenario 1.1  |                The user add 1 product to his cart                |
| :------------: | :--------------------------------------------------------------: |
|  Precondition  |   The user must be authenticated and a have "customer" (role)    |
| Post condition |          The cart should contain the requested product           |
|     Step#      |                         **Description**                          |
|       1        |                The customer has a list of product                |
|       2        |                The customer clicks on one product                |
|       3        |               The customer clicks on "Add to cart"               |
|       4        |         The system updates the cart and add the product          |
|       5        | The customer can click and "Continue ordering" (or "Go to cart") |

##### Scenario 1.2

|  Scenario 1.2  |           The user add n item of a product to his cart            |
| :------------: | :---------------------------------------------------------------: |
|  Precondition  |    The user must be authenticated and a have "customer" (role)    |
| Post condition |        The cart should contain the **n** requested product        |
|     Step#      |                          **Description**                          |
|       1        |                The customer has a list of product                 |
|       2        |                The customer clicks on one product                 |
|       3        |         The customer selects the number of item to **n**          |
|       4        |               The customer clicks on "Add to cart"                |
|       5        |         The system updates the cart and add the products          |
|       6        | The customer can clicks and "Continue ordering" (or "Go to cart") |

### UC2 - Use case 2 : Add New Product

| Actors Involved  |                                        Store Manager                                        |
| :--------------: | :-----------------------------------------------------------------------------------------: |
|   Precondition   |                     Manager is authenticated and has the "manager" role                     |
|  Post condition  |                           The new product is added to the system                            |
| Nominal Scenario |                The manager adds a new product with all required information                 |
|     Variants     |                   The manager adds a new product with additional details                    |
|    Exceptions    | Product with the same name already exists <br> Required fields are not filled out correctly |

##### Scenario 2.1: Add a new product

|  Scenario 2.1  |                    Manager add a new product to the system                    |
| :------------: | :---------------------------------------------------------------------------: |
|  Precondition  |              Manager is authenticated and has the "manager" role              |
| Post condition |                    The new product is added to the system                     |
|     Step#      |                                **Description**                                |
|       1        |            The manager navigates to the "Add New Product" section             |
|       2        | The manager enters product information (selling price, model, category, etc.) |
|       3        |                       The manager saves the new product                       |
|       4        |                 The system adds the product to the inventory                  |

### UC3 - Use Case 3: View Cart History

| Actors Involved  |                                  Customer                                  |
| :--------------: | :------------------------------------------------------------------------: |
|   Precondition   |           The customer authenticated and has the "customer" role           |
|  Post condition  |                  The customer can view their cart history                  |
| Nominal Scenario | The customer accesses and views their cart history (only checked out cart) |
|     Variants     |                                                                            |
|    Exceptions    |                 No cart history available for the customer                 |

##### Scenario 3.1: View cart history

|  Scenario 3.1  |                   Customer views cart history                   |
| :------------: | :-------------------------------------------------------------: |
|  Precondition  |    The customer is authenticated and has the "customer" role    |
| Post condition | The customer can view their cart history (only cheked out cart) |
|     Step#      |                         **Description**                         |
|       1        |            The customer navigates to "Cart" section             |
|       2        |           The customer navigates to "History" section           |
|       3        |     The customer sees a list of their past checket out cart     |
|       4        |     The customer clicks on a specific cart to view details      |

---

# Glossary - Sarv

![GLOSSARYv1.png](Images\GLOSSARYv1.png)


# System Design - Gino

\<describe here system design>

\<must be consistent with Context diagram>

# Deployment Diagram - Everybody

\<describe here deployment diagram >
