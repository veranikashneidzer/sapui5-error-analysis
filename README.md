# [Module 8] Fiori elements
## [Theory] Fiori elements

- ﻿[SAP Fiori Elements Overview](https://www.sap.com/design-system/fiori-design-web/discover/frameworks/sap-fiori-elements/smart-templates) 
- ﻿[Why use SAP Fiori Elements?](https://sapui5.hana.ondemand.com/sdk/#/topic/0a5377076f4e4ccba055a9072befadbd) 
- ﻿[SAP Fiori Elements Floorplans Overview](https://sapui5.hana.ondemand.com/sdk/#/topic/797c3239b2a9491fa137e4998fd76aa7)

## [Task 8-1] SAP Fiori Elements

- Fiori Elements is a tool provided by SAP to help developers create business applications quickly and easily. It uses pre-built templates and requires very little coding, so you don’t need to be an expert in designing or programming. It ensures that all apps look consistent, work well on all devices, and follow SAP's modern design standards.  
- SAP provides good course that we will use for this learning 
[Developing an SAP Fiori Elements App Based on a CAP OData V4 Service](https://learning.sap.com/courses/developing-an-sap-fiori-elements-app-based-on-a-cap-odata-v4-service) 
- ﻿﻿Please start with Unit 1 and complete all units under this course. 
- It will give you both theory and practical tasks.  

## [Task 8-2] Create new repository

- Create a new repository for your SAPUI5 project at https://github.com/ . 
- Use Public repository. 
- Name the repository sapui5-error-analysis 
- Clone the project from [this link](https://github.com/nulanovs/ManageProducts) . 
- Push project to your repository into main branch.

## [Task 8-3] App Enhancements

- Create a new branch ‘feature/task-8-3’ from main, checkout to it. 
- Implement the following requirements:
- Counter is showed only for shortage items, but for ‘Out of stock’ and ‘Plenty in stock’ it is missing, please fix it. 
- Now it is possible to click these buttons while none of the records are selected. We want to enable these buttons only when at least one record on the table is selected. 
- Button ‘Order’ currently does not work at all. When we click on ‘Order’ button it should update ‘Units In Stock’ field for selected records by adding 5 to existing value. In this example it would be 59 + 5, so new value should be 64.
- Search field is case sensitive. Please change it to be opposite. 
