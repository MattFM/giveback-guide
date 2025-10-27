export interface ImpactAreaData {
  description: string;
  code: string;
  color: string;
}

// Gradient mapping for each impact area
export const gradientMap: Record<string, string> = {
  // Environmental & Conservation
  "Marine Protection":
    "linear-gradient(135deg, rgba(30, 58, 138, 0.2) 0%, rgba(8, 145, 178, 0.2) 100%)",
  Reforestation:
    "linear-gradient(135deg, rgba(6, 95, 70, 0.2) 0%, rgba(110, 231, 183, 0.2) 100%)",
  "Animal Welfare":
    "linear-gradient(135deg, rgba(146, 64, 14, 0.2) 0%, rgba(252, 211, 77, 0.2) 100%)",
  "Waste and Litter Reduction":
    "linear-gradient(135deg, rgba(55, 65, 81, 0.2) 0%, rgba(110, 231, 183, 0.2) 100%)",
  "Sustainable Food Systems":
    "linear-gradient(135deg, rgba(120, 53, 15, 0.2) 0%, rgba(132, 204, 22, 0.2) 100%)",
  "River Health":
    "linear-gradient(135deg, rgba(12, 74, 110, 0.2) 0%, rgba(34, 211, 238, 0.2) 100%)",
  "Habitat Restoration":
    "linear-gradient(135deg, rgba(19, 78, 74, 0.2) 0%, rgba(125, 211, 252, 0.2) 100%)",
  "Wildlife Rehabilitation":
    "linear-gradient(135deg, rgba(202, 138, 4, 0.2) 0%, rgba(251, 146, 60, 0.2) 100%)",

  // Social Justice & Inclusion
  "LGBTQ+ Inclusion":
    "linear-gradient(135deg, rgba(225, 29, 72, 0.2) 0%, rgba(249, 115, 22, 0.2) 20%, rgba(251, 191, 36, 0.2) 40%, rgba(74, 222, 128, 0.2) 60%, rgba(59, 130, 246, 0.2) 80%, rgba(168, 85, 247, 0.2) 100%)",
  "Minority Heritage and Empowerment":
    "linear-gradient(135deg, rgba(88, 28, 135, 0.2) 0%, rgba(217, 70, 239, 0.2) 100%)",
  "Women's Empowerment":
    "linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)",
  "Disability Inclusion and Empowerment":
    "linear-gradient(135deg, rgba(30, 64, 175, 0.2) 0%, rgba(147, 197, 253, 0.2) 100%)",
  "Refugee and Migrant Inclusion":
    "linear-gradient(135deg, rgba(15, 118, 110, 0.2) 0%, rgba(94, 234, 212, 0.2) 100%)",

  // Community & Development
  "Community Development":
    "linear-gradient(135deg, rgba(161, 98, 7, 0.2) 0%, rgba(253, 224, 71, 0.2) 100%)",
  "Cultural Heritage Preservation":
    "linear-gradient(135deg, rgba(154, 52, 18, 0.2) 0%, rgba(254, 215, 170, 0.2) 100%)",
  "Poverty Alleviation":
    "linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(254, 202, 202, 0.2) 100%)",
  "Youth Development":
    "linear-gradient(135deg, rgba(113, 63, 18, 0.2) 0%, rgba(254, 243, 199, 0.2) 100%)",
  "Education and Skills Training":
    "linear-gradient(135deg, rgba(194, 65, 12, 0.2) 0%, rgba(253, 164, 175, 0.2) 100%)",
  "Homelessness Support":
    "linear-gradient(135deg, rgba(190, 18, 60, 0.2) 0%, rgba(253, 164, 175, 0.2) 100%)",
};

// SVG icon mapping for each impact area
export const iconMap: Record<string, string> = {
  // Environmental & Conservation
  "Marine Protection":
    '<svg viewBox="0 -960 960 960" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M57-90v-95q29.17-3 50.07-16.69 20.89-13.69 42.91-28.5Q172-245 198.42-257q26.41-12 65.47-12 39.11 0 66.61 13t49.77 29q22.27 16 45.52 29 23.25 13 53.98 13 31.69 0 54.46-13.19t45.04-29Q601.54-243 629.47-256q27.93-13 66.19-13Q736-269 762-257t47.5 27q21.5 15 42.5 28.5t51 16.5v95q-36.15-2-60.99-14.96-24.85-12.96-46.93-28T750.5-160.5Q728-173 696-173q-31 0-54.5 13t-46.34 28.54q-22.85 15.54-50.02 28.5Q517.96-90 479.89-90q-38.08 0-64.92-12.96-26.85-12.96-49.91-28.5Q342-147 318.67-160q-23.33-13-54.54-13-31.97 0-54.55 12.5t-44.52 27.54q-21.95 15.04-47.2 28Q92.61-92 57-90Zm0-200v-96q29.17-3 50.07-16.46 20.89-13.46 42.91-28Q172-445 198.42-457q26.41-12 65.47-12 39.11 0 66.61 13t49.77 28.5q22.27 15.5 45.52 28.5 23.25 13 53.98 13 31.69 0 54.46-12.96t45.04-28.5Q601.54-443 629.47-456q27.93-13 66.19-13Q736-469 762-457t47.5 26.5q21.5 14.5 42.5 28t51 16.5v96q-36.15-4-60.99-17.69-24.85-13.69-46.93-28T750.5-362q-22.5-12-54.07-12t-54.73 13.24q-23.15 13.25-46.3 29.16-23.16 15.92-50.23 28.76Q518.09-290 480.05-290q-38.05 0-65.1-13.03-27.06-13.03-49.81-28.65-22.75-15.62-46.39-28.97Q295.1-374 264.18-374q-31.69 0-54.44 12.5Q187-349 165.06-333.69q-21.95 15.31-47.2 28.5Q92.61-292 57-290Zm0-200v-96q29-1 49.98-14.46 20.98-13.46 43-28.5t48.44-27.54q26.41-12.5 65.47-12.5 39.11 0 66.61 13t49.77 28.5q22.27 15.5 45.52 28.5 23.25 13 53.98 13 31.69 0 54.46-12.96t45.04-28.5Q601.54-643 629.47-656q27.93-13 66.19-13Q736-669 762-656.5t47.5 27.5q21.5 15 42.5 28.5t51 14.5v96q-36.15-2-60.99-15.19-24.85-13.19-46.93-28.5T750.5-561.5Q728-574 696-574q-31 0-54.5 13.28-23.5 13.27-46.57 28.8-23.07 15.54-49.92 28.73Q518.15-490 480.08-490q-38.08 0-65.13-13.03-27.06-13.03-49.81-28.65-22.75-15.62-46.39-28.97Q295.1-574 264.18-574q-31.69 0-54.44 12.5Q187-549 165.06-533.69q-21.95 15.31-47.2 28.5Q92.61-492 57-490Zm0-200v-96q29.17-3 50.07-16.69 20.89-13.69 42.91-28.5Q172-846 198.35-858q26.35-12 65.32-12 39.01 0 66.67 13.5 27.66 13.5 49.93 29t45.52 28.5q23.25 13 53.98 13 31.69 0 54.46-13.19t45.27-28.5Q602-843 629.7-856.5q27.7-13.5 65.96-13.5Q736-870 762-858t47.5 27q21.5 15 42.5 28.5t51 16.5v96q-36.15-2-60.99-15.19-24.85-13.19-46.93-28.5T750.5-761.5Q728-774 696-774q-31 0-54.5 13.28-23.5 13.27-46.57 28.8-23.07 15.54-49.92 28.73Q518.15-690 480.08-690q-38.08 0-65.13-13.03-27.06-13.03-49.81-28.65-22.75-15.62-46.39-28.97Q295.1-774 264.18-774q-31.69 0-54.44 12.5Q187-749 165.06-733.69q-21.95 15.31-47.2 28.5Q92.61-692 57-690Z" fill="currentColor"></path></svg>',
  "Reforestation":
    '<svg viewBox="0 -960 960 960" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M280-55v-149H-58l192-274H34l315-446 131 186 131-186 315 446h-98l191 274H681v149H543v-149H418v149H280Zm411-243h146L645-572h94L611-753l-70 101 122 174h-99l127 180Zm-567 0h450L382-572h95L349-753 221-572h95L124-298Zm0 0h192-95 256-95 192-450Zm567 0H564h99-122 198-94 192-146Zm-148 94h138-138Zm214 0Z" fill="currentColor"></path></svg>',
  "Animal Welfare":
    '<svg viewBox="0 -960 960 960" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="m324-83-55-23 60-145q-110-24-179.5-111.5T80-562.24V-727q0-64 45.24-108.5T234-880q17.39 0 33.19 4Q283-872 299-865l234 97-146 54v76l453 288 40 190h-80l-38-84H552v164h-60v-164H391L324-83Zm74-221h402l-101-64H397.6q-68.6 0-119.1-46T228-528h60q0 43 32.31 71.5Q352.63-428 398-428h207L327-605v-122q0-38.36-27.45-65.68-27.45-27.32-66-27.32t-66.05 27Q140-766 140-727v165q0 107.5 75.25 182.75T398-304ZM234.18-697q-12.83 0-21.5-8.68-8.68-8.67-8.68-21.5 0-12.82 8.68-20.82 8.67-8 21.5-8 12.82 0 20.82 8t8 20.82q0 12.83-8 21.5-8 8.68-20.82 8.68ZM398-368Z" fill="currentColor"></path></svg>',
  "Waste and Litter Reduction":
    '<svg viewBox="0 -960 960 960" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="m362-600 94-155-62-104q-14-20-37.5-20T321-859L217-686l145 86Zm409 288-94-157 147-84 68 113q11 19 11.5 41t-8.5 41q-11 22-31.5 34T819-312h-48ZM649-16 480-185l169-169v84h201l-61 123q-12 22-32 34t-44 12h-64v85Zm-409-85q-21 0-38.5-10.5T176-141q-9-17-8.5-35t10.5-35l36-59h182v169H240ZM135-221 67-358q-11-19-10-40.5T70-440l17-29-72-43 231-58 58 233-72-45-97 161Zm571-362-231-58 73-43-133-220h150q22 0 41 11.5t31 29.5l55 92 73-45-59 233Z" fill="currentColor"></path></svg>',
  "Sustainable Food Systems":
    '<svg viewBox="0 -960 960 960" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M215.42-55q-44.21 0-78.13-26.94Q103.38-108.89 93-153L55-313h74.08q-.08-6 1.42-13t4.5-13v-481.29L906-906v62l-485 54.6v90.4h485v62H421v44q15-3 29.17-4 14.18-1 29.83-1 130.79 0 228.39 81Q806-436 831.62-313H906l-38.75 159.68Q856-110 822.97-82.5 789.94-55 745.58-55H215.42Zm-.42-78h531q16 0 28.5-11.5T791-172l14-62H156l14 62q3 16 15.4 27.5T215-133Zm-5-180h71q22.43-59.2 76.41-96.6Q411.39-447 479.57-447q68.19 0 122.81 37.5Q657-372 679-313h72q-23-89-97.65-147.5T480.34-519Q382-519 307.5-460.5T210-313Zm164 0h212q-15.87-24.3-43.92-40.15Q514.03-369 480.01-369q-34.01 0-62.11 15.79Q389.81-337.42 374-313ZM197-459q11-15 23.5-28.34Q233-500.69 247-512v-125h-50v178Zm112-96q12-7 24.5-12.15Q346-572.31 359-577v-60h-50v82ZM197-699h50v-71l-50 6v65Zm112 0h50v-83l-50 6v77Zm171 465Z" fill="currentColor"></path></svg>',
  "River Health":
    '<svg viewBox="0 -960 960 960" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M481-212q19 0 30.5-7.93T523-241q0-14-11-22.5t-31.75-8.5q-47.25 0-80.75-25.5T355-378q-1.89-10.12-10.45-18.06Q336-404 324-404q-15.81 0-23.41 10.5Q293-383 295-371q15.12 85 71.23 122 56.11 37 114.77 37Zm-1.1 157q-147.66 0-246.28-101.16Q135-257.33 135-408q0-105.91 85.5-231.46Q306-765 480-913q174 148 260 273.54Q826-513.91 826-408q0 150.67-99.22 251.84Q627.56-55 479.9-55Zm.03-94Q588-149 659.5-222.94T731-408q0-74-64-170T480-787Q357-674 293-578t-64 170q0 111.12 71.43 185.06T479.93-149Zm.07-335Z" fill="currentColor"></path></svg>',
  "Habitat Restoration":
    '<svg viewBox="0 -960 960 960" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M450-130v-309h-20q-64 0-120.5-24.5T209-533q-44-45-66.5-104T120-760v-80h78.32Q260-840 317-815.5 374-791 419-746q33 34 54.5 76t30.5 89q7.65-11.9 16.82-22.95Q530-615 540-626q45-45 102-69.5T761.67-720H840v80q0 64-23.98 123T748-413q-45 45-101.56 69T528-320h-18v190h-60Zm1-370q0-61-20-113.5t-55-89q-35-36.5-86-57T180-780q0 63 18.5 115.5T252-575q42 45 90.5 60T451-500Zm59 120q60 0 111-19.5t86-56q35-36.5 54-89T780-660q-60 0-111 20.5T583-583q-43 45-58 94t-15 109Zm0 0Zm-59-120Z" fill="currentColor"></path></svg>',
  "Wildlife Rehabilitation":
    '<svg viewBox="0 -960 960 960" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M149.36-496q-40.3 0-67.83-27.85T54-592.03q0-40.33 27.6-68.15Q109.21-688 149.18-688q40.82 0 68.32 27.46 27.5 27.46 27.5 68.18 0 40.72-27.46 68.54Q190.08-496 149.36-496Zm197.61-180q-39.91 0-67.44-27.57T252-771.07Q252-811 279.57-839q27.57-28 67.5-28T415-839.54q28 27.46 28 68.18 0 40.3-27.85 67.83T346.97-676Zm265.85 0Q573-676 545-703.6q-28-27.61-28-67.58 0-40.82 27.85-68.32Q572.7-867 613.03-867q39.91 0 67.94 27.88T709-770.86q0 39.96-28.18 67.41-28.19 27.45-68 27.45Zm198 180q-40.82 0-68.32-27.88-27.5-27.88-27.5-68.26 0-41.22 27.46-68.54Q769.92-688 810.64-688q40.3 0 67.83 27.85T906-591.97q0 40.33-27.6 68.15Q850.79-496 810.82-496ZM259-59q-46 0-75.5-34T154-174.55Q154-219 182-253t57-66.9q21-25.1 41-49.6t39-52.5q30.33-45.73 68.08-84.87Q424.84-546 479.92-546q55.08 0 93.36 39.45Q611.55-467.1 643-421q18.18 26.21 37.29 51.6Q699.4-344 721-320q29 33 57 67t28 78.45Q806-127 776.5-93T701-59q-56.5 0-110.5-9.5T480-78q-56.5 0-110.5 9.5T259-59Z" fill="currentColor"></path></svg>',

  // Social Justice & Inclusion
  "LGBTQ+ Inclusion":
    '<svg viewBox="0 -960 960 960" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M49-408q-25.47-43-37.24-85.5Q0-536 0-575.51 0-685 77.5-762.5 155-840 263.64-840q63 0 119.18 25.5Q439-789 480-743q41-46 97.18-71.5Q633.36-840 696-840q109 0 186.5 77.5T960-575.51q0 39.51-11.97 81.5Q936.05-452.02 911-410q-18-16-41-23.5t-47-8.5q20.89-35 31.95-68.5Q866-544 866-576q0-70-50-120t-120-50q-45 0-97.5 23.5T480-618q-66-80-118.5-104T264-746q-70 0-119.5 50T95-576q0 32 10.55 65.5Q116.11-477 138-442q-24 1-47 9.5T49-408ZM-12-20v-65.47q0-43.79 44.95-71.16Q77.9-184 150-184h12.23q4.77 0 10.77 1-9 19-14.5 40.33Q153-121.33 153-97v77H-12Zm240 0v-77q0-71.17 69.79-114.09Q367.57-254 479.86-254 594-254 663-211.09 732-168.17 732-97v77H228Zm579 0v-77.43q0-23.94-5-45.19-5-21.25-14-40.38 6-1 11.09-1H810q73.2 0 117.6 27.28Q972-129.44 972-85v65H807ZM480.13-175Q415-175 372.5-156T322-105v5h316v-6q-8-31-50-50t-107.87-19Zm-329.92-36Q118-211 95.5-233.77T73-288.72Q73-321 95.56-343.5t54.46-22.5Q182-366 205-343.46q23 22.53 23 54.54Q228-257 205.26-234t-55.05 23Zm660 0q-32.21 0-54.71-22.77T733-288.72q0-32.28 22.56-54.78t54.46-22.5Q842-366 865-343.46q23 22.53 23 54.54Q888-257 865.26-234t-55.05 23Zm-329.72-72q-55.2 0-93.85-38.64Q348-360.29 348-415.49 348-471 386.64-509q38.65-38 93.85-38Q536-547 574-509q38 38 38 93.51 0 55.2-38 93.85Q536-283 480.49-283ZM480-468q-22 0-37 14.93t-15 37.88q0 21.19 15 36.69 15 15.5 37.5 15.5 21.5 0 37-15.61 15.5-15.6 15.5-37Q533-438 517.38-453q-15.63-15-37.38-15Zm0 53Zm0 315Z" fill="currentColor"></path></svg>',
  "Minority Heritage and Empowerment":
    '<svg viewBox="0 -960 960 960" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M234-336q-29.29 0-50.14-21.21-20.86-21.21-20.86-51T183.86-459q20.85-21 50.14-21 30.11 0 51.56 21.21 21.44 21.21 21.44 51T285.56-357q-21.45 21-51.56 21Zm491 0q-30.11 0-51.56-21.21-21.44-21.21-21.44-51T673.44-459q21.45-21 51.56-21 29.29 0 50.14 21.21 20.86 21.21 20.86 51T775.14-357q-20.85 21-50.14 21Zm-245-42q-38 0-65-27t-27-65q0-38 27-65t65-27q38 0 65 27t27 65q0 38-27 65t-65 27ZM288-121q14-66 67.3-110.5T480-276q71.4 0 124.7 44.5T672-121H288Zm-208 0q0-65 45.24-110T234-276q23 0 44.5 6t39.5 18q-27 25.93-45 59.47Q255-159 248-121H80Zm632 0q-7-38-25-71.53-18-33.54-45-59.47 18-11 39-17.5t44-6.5q63.94 0 109.47 45T880-121H712ZM76-500l-36-47 440-333 177 134v-96h102v173.41L920-547l-36 47-404-304L76-500Z" fill="currentColor"></path></svg>',
  "Women's Empowerment":
    '<svg viewBox="0 -960 960 960" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M433-92v-80h-80v-88h80v-89q-83-16-136.5-81.21Q243-495.41 243-580q0-98.93 69.48-167.97Q381.97-817 480-817q98.03 0 167.52 69.03Q717-678.93 717-580q0 84.59-53.5 149.79Q610-365 527-349v89h80v88h-80v80h-94Zm46.8-345q60.2 0 101.7-41.3T623-579.8q0-60.2-41.3-101.7T480.2-723q-60.2 0-101.7 41.3T337-580.2q0 60.2 41.3 101.7T479.8-437Z" fill="currentColor"></path></svg>',
  "Disability Inclusion and Empowerment":
    '<svg viewBox="0 -960 960 960" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M260-734q-30 0-51.5-21.5T187-807q0-30 21.5-51.5T260-880q30 0 51.5 21.5T333-807q0 30-21.5 51.5T260-734ZM200-80v-280h-80v-253q0-25 17.5-42.5T180-673h160q25 0 42.5 17.5T400-613v123q-51 33-83.5 90T284-276q0 40 11 73.5t25 56.5v66H200Zm340 0q-81 0-138.5-57T344-276q0-60 37.5-115.5T490-465v66q-41 14-63.5 50T404-276q0 57 39.5 96.5T540-140q60 0 100.5-47T670-300h60q13 85-45.5 152.5T540-80Zm314-86L743-330H520v-300h60v240h197l127 191-50 33Z" fill="currentColor"></path></svg>',
  "Refugee and Migrant Inclusion":
    '<svg viewBox="0 -960 960 960" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M140-120q-24.75 0-42.37-17.63Q80-155.25 80-180v-480q0-24.75 17.63-42.38Q115.25-720 140-720h180v-100q0-24.75 17.63-42.38Q355.25-880 380-880h200q24.75 0 42.38 17.62Q640-844.75 640-820v100h180q24.75 0 42.38 17.62Q880-684.75 880-660v480q0 24.75-17.62 42.37Q844.75-120 820-120H140Zm240-600h200v-100H380v100Zm-133 60H140v480h107v-480Zm407 480v-480H307v480h347Zm60-480v480h106v-480H714ZM480-425Z" fill="currentColor"></path></svg>',

  // Community & Development
  "Community Development":
    '<svg viewBox="0 -960 960 960" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M670.5-575q-26.5 0-45-18.71T607-639q0-26.58 18.59-44.79t45-18.21q26.41 0 44.91 18.21Q734-665.58 734-639t-18.5 45.29Q697-575 670.5-575ZM290-575q-26.58 0-44.79-18.71T227-639q0-26.58 18.09-44.79t44.5-18.21q26.41 0 44.91 18.21Q353-665.58 353-639t-18.42 45.29Q316.17-575 290-575Zm190 116q-26.58 0-45.29-18T416-522q0-27 18.71-45.5T480-586q26.58 0 45.29 18.71T544-522q0 27-18.71 45T480-459Zm0-232q-26.58 0-45.29-18.71T416-755q0-26.58 18.71-45.29T480-819q26.58 0 45.29 18.71T544-755q0 26.58-18.71 45.29T480-691Zm-.25 550q-19.75 0-41.25-3.5T398-153v-151.79Q398-342 421-369q23-27 59-27t59.5 27q23.5 27 23.5 64.21V-153q-20 5-41.75 8.5-21.74 3.5-41.5 3.5ZM334-175q-20-8-40-18.5T256-217q-30-20-47.5-53.5T191-344q0-27-5-52t-20.83-46.39Q154-455 124-482.5T71-534q-14-15-14-31t13.5-30q14.5-15 30-15t29.5 15l163 153q19 19 30 45.52 11 26.52 11 53.02V-175Zm292 0v-168.35q0-26.53 13.5-53.09Q653-423 673-442l157-153q13-12 30-12t30 12q13 14 13 30t-13 31q-24 24-54 50.5T794.83-442Q779-421 774-396q-5 25-5 51.8 0 39.71-17.5 73.46Q734-237 703.71-216.78q-17.61 11.56-37.66 22.67Q646-183 626-175Z" fill="currentColor"></path></svg>',
  "Cultural Heritage Preservation":
    '<svg viewBox="0 -960 960 960" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M132-34v-390q-51-17-90-61T0-589h95q3 35 27.88 57T178-510h34v-91q-51-17-90-61T80-766h95q3 35 27.88 57T258-687h15l207-274 207 274h15q30.24 0 55.12-22T785-766h96q-4 59.6-42.58 103.7Q799.83-618.2 749-601v91h33q30.24 0 55.12-22T865-589h96q-4 60.6-42.58 104.27Q879.83-441.06 829-424v390H524v-178q0-18.1-12.93-31.05t-31-12.95Q462-256 449-243.05T436-212v178H132Zm259-653h178l-89-121-89 121Zm-85 177h348v-83H306v83Zm-80 381h116v-83q0-56.67 40.35-97.33 40.36-40.67 98-40.67 57.65 0 98.15 40.67Q619-268.67 619-212v83h115v-287H226v287Zm254-287Zm0-271Zm0 177Z" fill="currentColor"></path></svg>',
  "Poverty Alleviation":
    '<svg viewBox="0 -960 960 960" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M662-491 485.15-658.55q-30.55-29.29-52.35-64.38Q411-758.02 411-800q0-58 40-99t99-41q33 0 60.5 15.5t51 37.5q23.5-22 51.64-37.5Q741.27-940 774-940q57.5 0 98.25 41T913-800q0 41.89-22.47 76.89-22.48 35.01-52.7 64.56L662-491Zm0-110 116.74-110.11q20.38-17.74 35.82-38.98Q830-771.33 830-798q0-24.19-16-42.1-16-17.9-39.83-17.9-19.02 0-34.59 11Q724-836 711-822l-49 46-50.13-46.47Q599-836 583.92-847q-15.07-11-34.09-11Q526-858 510-840.1q-16 17.91-16 42.1 0 25.79 16 47.32T546-711l116 110ZM269-195l296 88 248-78q0-20-15.5-33.5T761-232H545q-10 0-24.83-2.5-14.82-2.5-30.17-7.18L394-270l21-61 101 34q7 3 16 4.5t20 .5h56q0-21-14-36.5T560-352l-218-83h-73v240ZM20-55v-463h319q8.33 0 16.67 1.5Q364-515 373-512l215 81q44 17 75 53.5t31 85.5h67q60.42 0 102.71 33.5Q906-225 906-167v43L570-21l-301-87v53H20Zm83-82h82v-298h-82v298Zm559-639Z" fill="currentColor"></path></svg>',
  "Youth Development":
    '<svg viewBox="0 -960 960 960" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M260.21-733q-35.21 0-59.71-24.75t-24.5-59.5Q176-852 200.29-877t59.5-25q35.21 0 59.71 24.91 24.5 24.9 24.5 59.88 0 34.56-24.29 59.38Q295.42-733 260.21-733Zm435.2 250Q666-483 645-503.59q-21-20.59-21-50t20.59-50.91q20.59-21.5 50-21.5T745-604.74q21 21.27 21 50.68t-20.59 50.24q-20.59 20.82-50 20.82ZM167-72v-287H97v-233q0-38.77 27.61-66.39Q152.22-686 191-686h130q31.45 0 55.22 18Q400-650 411-621l100 270 75-76q10-10 23.5-16t28.5-6h92q29.17 0 49.58 20.71Q800-407.58 800-378v156h-50v150H610v-300l-74 80h-78L350-547v475H167Z" fill="currentColor"></path></svg>',
  "Education and Skills Training":
    '<svg viewBox="0 -960 960 960" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M479-110 179-273v-240L18-600l461-251 463 251v328h-83v-280l-79 39v240L479-110Zm0-333 287-157-287-154-285 154 285 157Zm0 239 217-120v-140L479-349 262-466v142l217 120Zm1-239Zm-1 84Zm0 0Z" fill="currentColor"></path></svg>',
  "Homelessness Support":
    '<svg viewBox="0 -960 960 960" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M280-240h40v-60h320v60h40v-160q0-33-23.5-56.5T600-480H460v140H320v-180h-40v280Zm110-120q21 0 35.5-14.5T440-410q0-21-14.5-35.5T390-460q-21 0-35.5 14.5T340-410q0 21 14.5 35.5T390-360ZM135-95v-518l345-259 346 259v518H135Zm94-94h502v-381L480-752 229-569.67V-189Zm251-282Z" fill="currentColor"></path></svg>',
};

export const impactAreaData: Record<string, ImpactAreaData> = {
  // Environmental & Conservation (E01-E08)
  "Animal Welfare": {
    description: "Improves the wellbeing, care, or adoption of animals",
    code: "E01",
    color: "text-green-700 dark:text-green-400"
  },
  "Wildlife Rehabilitation": {
    description: "Rescues, treats, and releases wild animals where possible",
    code: "E02",
    color: "text-green-700 dark:text-green-400"
  },
  "Sustainable Food Systems": {
    description: "Champions fully vegan offerings and plant‑based choices that reduce environmental impact",
    code: "E03",
    color: "text-green-700 dark:text-green-400"
  },
  "Waste and Litter Reduction": {
    description: "Reduces waste and improves local cleanliness",
    code: "E04",
    color: "text-green-700 dark:text-green-400"
  },
  "Marine Protection": {
    description: "Protects beaches and coastal ecosystems",
    code: "E05",
    color: "text-green-700 dark:text-green-400"
  },
  "River Health": {
    description: "Restores and protects rivers and freshwater habitats",
    code: "E06",
    color: "text-green-700 dark:text-green-400"
  },
  "Reforestation": {
    description: "Plants trees and restores forest cover",
    code: "E07",
    color: "text-green-700 dark:text-green-400"
  },
  "Habitat Restoration": {
    description: "Repairs damaged ecosystems and biodiversity",
    code: "E08",
    color: "text-green-700 dark:text-green-400"
  },
  // Social Justice & Inclusion (S01-S05)
  "Women's Empowerment": {
    description: "Increases opportunities, income, skills, and leadership for women",
    code: "S01",
    color: "text-purple-700 dark:text-purple-400"
  },
  "LGBTQ+ Inclusion": {
    description: "Fights inequality, raises awareness, and creates safe, welcoming spaces",
    code: "S02",
    color: "text-purple-700 dark:text-purple-400"
  },
  "Disability Inclusion and Empowerment": {
    description: "Accessible spaces, jobs, and advancement for disabled people",
    code: "S03",
    color: "text-purple-700 dark:text-purple-400"
  },
  "Refugee and Migrant Inclusion": {
    description: "Creates livelihoods, skills, and representation for refugees, migrants and asylum seekers",
    code: "S04",
    color: "text-purple-700 dark:text-purple-400"
  },
  "Minority Heritage and Empowerment": {
    description: "Sustains and uplifts ethnic minority communities through culture, enterprise, and services",
    code: "S05",
    color: "text-purple-700 dark:text-purple-400"
  },
  // Community & Development (C01-C06)
  "Youth Development": {
    description: "Skills, safety, and opportunities for young people",
    code: "C01",
    color: "text-blue-700 dark:text-blue-400"
  },
  "Education and Skills Training": {
    description: "Learning that unlocks livelihoods",
    code: "C02",
    color: "text-blue-700 dark:text-blue-400"
  },
  "Community Development": {
    description: "Strengthens local services, livelihoods, and participation through training, employment, and community spaces",
    code: "C03",
    color: "text-blue-700 dark:text-blue-400"
  },
  "Poverty Alleviation": {
    description: "Direct support that lifts living standards and reduces hardship",
    code: "C04",
    color: "text-blue-700 dark:text-blue-400"
  },
  "Homelessness Support": {
    description: "Supporting people experiencing homelessness and working to end homelessness",
    code: "C05",
    color: "text-blue-700 dark:text-blue-400"
  },
  "Cultural Heritage Preservation": {
    description: "Protects languages, crafts, and traditions",
    code: "C06",
    color: "text-blue-700 dark:text-blue-400"
  }
};

export function getImpactAreaData(name: string): ImpactAreaData | null {
  // Try exact match first
  if (impactAreaData[name]) {
    return impactAreaData[name];
  }
  
  // Handle different apostrophe characters (curly vs straight quotes)
  // Convert Unicode characters like 8217 (') to standard apostrophe (')
  const normalizedName = name.replace(/[\u2018\u2019\u201B]/g, "'");
  if (impactAreaData[normalizedName]) {
    return impactAreaData[normalizedName];
  }
  
  return null;
}

export function enrichImpactAreas(areas: string[]): Array<{ name: string; data: ImpactAreaData | null }> {
  return areas.map(area => ({
    name: area,
    data: getImpactAreaData(area)
  }));
}
