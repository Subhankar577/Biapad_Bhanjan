/* =========================================================================
   NET Compass — Syllabus data (source of truth)
   Read from the official UGC NET syllabus PDF (Paper I Code 00,
   Paper II Code 87 — Computer Science and Applications).
   NOTHING here is invented: names, clusters and key terms are transcribed
   from those two documents. Items whose print was ambiguous carry
   verify:true and are flagged in the UI with "⚠ Verify with official PDF".
   The user may edit everything from the in-app Syllabus Editor.
   ========================================================================= */

export const DATA_VERSION = 2;

/* Prerequisite-aware default unit order for Paper II.
   Discrete maths → architecture → programming → DSA → OS → DBMS →
   TOC/compilers → networks → software engineering → AI. */
export const PAPER_II_ORDER = [
  'P2U1', 'P2U2', 'P2U3', 'P2U7', 'P2U5',
  'P2U4', 'P2U8', 'P2U9', 'P2U6', 'P2U10'
];

export const PAPERS = [
  {
    id: 'P1',
    code: '00',
    title: {
      en: 'Paper I — General Paper on Teaching & Research Aptitude',
      bn: 'পত্র I — শিক্ষণ ও গবেষণা যোগ্যতা (সাধারণ পত্র)'
    },
    short: { en: 'Paper I', bn: 'পত্র I' },
    pattern: { questions: 50, marks: 100, minutes: 60 },
    examNote:
      'Five questions each carrying 2 marks are to be set from each Module (10 units × 5 questions × 2 marks = 50 questions = 100 marks).',
    units: [
      {
        id: 'P1U1', n: 1,
        name: { en: 'Teaching Aptitude', bn: 'শিক্ষণ যোগ্যতা' },
        clusters: [
          { id: 'P1U1C1', name: 'Teaching: concept, objectives, levels', sessions: 1, depth: 'D2',
            terms: 'Teaching, objectives, levels of teaching (Memory, Understanding, Reflective), characteristics and basic requirements' },
          { id: 'P1U1C2', name: "Learner's characteristics", sessions: 1, depth: 'D2',
            terms: 'Characteristics of adolescent and adult learners (Academic, Social, Emotional and Cognitive), individual differences' },
          { id: 'P1U1C3', name: 'Factors affecting teaching', sessions: 1, depth: 'D2',
            terms: 'Teacher, Learner, Support material, Instructional facilities, Learning environment and Institution' },
          { id: 'P1U1C4', name: 'Methods of teaching in higher learning institutions', sessions: 1, depth: 'D2',
            terms: 'Teacher centred vs Learner centred methods; Off-line vs On-line methods (SWAYAM, SWAYAMPRABHA, MOOCs etc.)' },
          { id: 'P1U1C5', name: 'Teaching support system & evaluation systems', sessions: 1, depth: 'D2',
            terms: 'Traditional, Modern and ICT based support; Elements and Types of evaluation; Evaluation in Choice Based Credit System (CBCS); Computer based testing; Innovations in evaluation systems' }
        ]
      },
      {
        id: 'P1U2', n: 2,
        name: { en: 'Research Aptitude', bn: 'গবেষণা যোগ্যতা' },
        clusters: [
          { id: 'P1U2C1', name: 'Research: meaning, types, characteristics', sessions: 1, depth: 'D2',
            terms: 'Research meaning, Types and Characteristics; Positivism and Post-positivistic approach to research' },
          { id: 'P1U2C2', name: 'Methods of research', sessions: 1, depth: 'D2',
            terms: 'Experimental, Descriptive, Historical, Qualitative and Quantitative methods' },
          { id: 'P1U2C3', name: 'Steps of research', sessions: 1, depth: 'D2',
            terms: 'Steps of Research' },
          { id: 'P1U2C4', name: 'Thesis & article writing, referencing', sessions: 1, depth: 'D2',
            terms: 'Thesis and Article writing: Format and styles of referencing' },
          { id: 'P1U2C5', name: 'ICT in research; research ethics', sessions: 1, depth: 'D2',
            terms: 'Application of ICT in research; Research ethics' }
        ]
      },
      {
        id: 'P1U3', n: 3,
        name: { en: 'Comprehension', bn: 'বোধগম্যতা (প্যাসেজ)' },
        clusters: [
          { id: 'P1U3C1', name: 'Passage: main idea & direct questions', sessions: 1, depth: 'D2',
            terms: 'A passage of text to be given — main idea, direct questions' },
          { id: 'P1U3C2', name: 'Inference, vocabulary, tone, purpose', sessions: 1, depth: 'D2',
            terms: 'Inference, vocabulary-in-context, tone, author\u2019s purpose' },
          { id: 'P1U3C3', name: 'Timed passage practice sets', sessions: 1, depth: 'D3',
            terms: 'Timed passage practice sets (exam-speed practice)' }
        ]
      },
      {
        id: 'P1U4', n: 4,
        name: { en: 'Communication', bn: 'যোগাযোগ' },
        clusters: [
          { id: 'P1U4C1', name: 'Communication: meaning, types, characteristics', sessions: 1, depth: 'D2',
            terms: 'Meaning, types and characteristics of communication' },
          { id: 'P1U4C2', name: 'Effective communication', sessions: 1, depth: 'D2',
            terms: 'Verbal and Non-verbal, Inter-Cultural and group communications, Classroom communication' },
          { id: 'P1U4C3', name: 'Barriers; mass media and society', sessions: 1, depth: 'D2',
            terms: 'Barriers to effective communication; Mass-Media and Society' }
        ]
      },
      {
        id: 'P1U5', n: 5,
        name: { en: 'Mathematical Reasoning and Aptitude', bn: 'গাণিতিক যুক্তি ও দক্ষতা' },
        clusters: [
          { id: 'P1U5C1', name: 'Types of reasoning; number series', sessions: 1, depth: 'D3',
            terms: 'Types of reasoning; Number series' },
          { id: 'P1U5C2', name: 'Letter series', sessions: 1, depth: 'D3',
            terms: 'Letter series' },
          { id: 'P1U5C3', name: 'Codes and relationships', sessions: 1, depth: 'D3',
            terms: 'Codes and Relationships' },
          { id: 'P1U5C4', name: 'Mathematical aptitude: fractions', sessions: 1, depth: 'D3',
            terms: 'Mathematical Aptitude: Fraction' },
          { id: 'P1U5C5', name: 'Time & distance, ratio, proportion, percentage', sessions: 1, depth: 'D3',
            terms: 'Time & Distance, Ratio, Proportion and Percentage' },
          { id: 'P1U5C6', name: 'Profit & loss, interest, discounting', sessions: 1, depth: 'D3',
            terms: 'Profit and Loss, Interest and Discounting' },
          { id: 'P1U5C7', name: 'Averages + mixed problem practice', sessions: 1, depth: 'D3',
            terms: 'Averages + mixed problem practice' }
        ]
      },
      {
        id: 'P1U6', n: 6,
        name: { en: 'Logical Reasoning', bn: 'যৌক্তিক যুক্তি' },
        clusters: [
          { id: 'P1U6C1', name: 'Structure of arguments, mood & figure', sessions: 1, depth: 'D2',
            terms: 'Argument forms, structure of categorical propositions, Mood and Figure' },
          { id: 'P1U6C2', name: 'Formal & informal fallacies; square of opposition', sessions: 1, depth: 'D2',
            terms: 'Formal and Informal fallacies, Uses of language, Connotations and Denotations of terms, Classical square of opposition' },
          { id: 'P1U6C3', name: 'Deductive vs inductive reasoning', sessions: 1, depth: 'D2',
            terms: 'Evaluating and distinguishing deductive and inductive reasoning' },
          { id: 'P1U6C4', name: 'Analogies', sessions: 1, depth: 'D2',
            terms: 'Analogies' },
          { id: 'P1U6C5', name: 'Venn diagrams for validity', sessions: 1, depth: 'D3',
            terms: 'Venn diagram: Simple and multiple use for establishing validity of arguments' },
          { id: 'P1U6C6', name: 'Indian Logic: Pramanas', sessions: 1, depth: 'D2',
            terms: 'Pratyaksha (Perception), Anumana (Inference), Upamana (Comparison), Shabda (Verbal testimony), Arthapatti (Implication), Anupalabdhi (Non-apprehension)' },
          { id: 'P1U6C7', name: 'Anumana, Vyapti, Hetvabhasas', sessions: 1, depth: 'D2',
            terms: 'Structure and kinds of Anumana, Vyapti (Invariable relation), Hetvabhasas (Fallacies of inference)' }
        ]
      },
      {
        id: 'P1U7', n: 7,
        name: { en: 'Data Interpretation', bn: 'ডেটা বিশ্লেষণ' },
        clusters: [
          { id: 'P1U7C1', name: 'Data: sources, acquisition, classification', sessions: 1, depth: 'D2',
            terms: 'Sources, acquisition and classification of Data; Quantitative and Qualitative Data' },
          { id: 'P1U7C2', name: 'Graphical representation & mapping of data', sessions: 1, depth: 'D2',
            terms: 'Bar-chart, Histogram, Pie-chart, Table-chart and Line-chart; mapping of Data' },
          { id: 'P1U7C3', name: 'Data interpretation practice sets', sessions: 1, depth: 'D3',
            terms: 'Data interpretation practice sets' },
          { id: 'P1U7C4', name: 'Data & governance + mixed DI sets', sessions: 1, depth: 'D2',
            terms: 'Data and Governance + mixed data interpretation sets' }
        ]
      },
      {
        id: 'P1U8', n: 8,
        name: { en: 'Information and Communication Technology (ICT)', bn: 'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)' },
        clusters: [
          { id: 'P1U8C1', name: 'ICT: abbreviations and terminology', sessions: 1, depth: 'D2',
            terms: 'ICT general abbreviations and terminology' },
          { id: 'P1U8C2', name: 'Internet, intranet, e-mail, conferencing', sessions: 1, depth: 'D2',
            terms: 'Basics of Internet, Intranet, E-mail, Audio and Video-conferencing' },
          { id: 'P1U8C3', name: 'Digital initiatives; ICT and governance', sessions: 1, depth: 'D2',
            terms: 'Digital initiatives in higher education; ICT and Governance' }
        ]
      },
      {
        id: 'P1U9', n: 9,
        name: { en: 'People, Development and Environment', bn: 'মানুষ, উন্নয়ন ও পরিবেশ' },
        clusters: [
          { id: 'P1U9C1', name: 'MDGs, SDGs; human–environment interaction', sessions: 1, depth: 'D2',
            terms: 'Millennium Development Goals and Sustainable Development Goals; Human and environment interaction; Anthropogenic activities and their impacts on environment' },
          { id: 'P1U9C2', name: 'Environmental issues & pollution', sessions: 1, depth: 'D2',
            terms: 'Local, Regional and Global issues; Air, Water, Soil and Noise pollution; Waste (solid, liquid, biomedical, hazardous, electronic); Climate change and its socio-economic and political dimensions; Impacts of pollutants on human health' },
          { id: 'P1U9C3', name: 'Natural and energy resources', sessions: 1, depth: 'D2',
            terms: 'Solar, Wind, Soil, Hydro, Geothermal, Biomass, Nuclear and Forests' },
          { id: 'P1U9C4', name: 'Hazards, disaster mitigation, environmental law', sessions: 1, depth: 'D2',
            terms: 'Environmental Protection Act (1986), National Action Plan on Climate Change, Montreal Protocol, Rio Summit, Convention on Biodiversity, Kyoto Protocol, Paris Agreement, International Solar Alliance' }
        ]
      },
      {
        id: 'P1U10', n: 10,
        name: { en: 'Higher Education System', bn: 'উচ্চশিক্ষা ব্যবস্থা' },
        clusters: [
          { id: 'P1U10C1', name: 'Ancient & post-independence higher learning', sessions: 1, depth: 'D2',
            terms: 'Institutions of higher learning and education in ancient India; Evolution of higher learning and research in Post-Independence India' },
          { id: 'P1U10C2', name: 'Learning programmes; professional & skill education', sessions: 1, depth: 'D2',
            terms: 'Oriental, Conventional and Non-conventional learning programmes in India; Professional, Technical and Skill Based education' },
          { id: 'P1U10C3', name: 'Value education; policies and governance', sessions: 1, depth: 'D2',
            terms: 'Value education and environmental education; Policies, Governance, and Administration' }
        ]
      }
    ]
  },

  {
    id: 'P2',
    code: '87',
    title: {
      en: 'Paper II — Computer Science and Applications',
      bn: 'পত্র II — কম্পিউটার সায়েন্স অ্যান্ড অ্যাপ্লিকেশনস'
    },
    short: { en: 'Paper II', bn: 'পত্র II' },
    pattern: { questions: 100, marks: 200, minutes: 120 },
    examNote: 'NTA pattern, general guidelines. Confirm from the latest Information Bulletin.',
    units: [
      {
        id: 'P2U1', n: 1,
        name: { en: 'Discrete Structures and Optimization', bn: 'ডিসক্রিট স্ট্রাকচার ও অপ্টিমাইজেশন' },
        clusters: [
          { id: 'P2U1C1', name: 'Mathematical Logic', sessions: 3, depth: 'D3',
            terms: 'Propositional and Predicate Logic, Propositional Equivalences, Normal Forms, Predicates and Quantifiers, Nested Quantifiers, Rules of Inference' },
          { id: 'P2U1C2', name: 'Sets and Relations', sessions: 2, depth: 'D2',
            terms: 'Set Operations, Representation and Properties of Relations, Equivalence Relations, Partially Ordering' },
          { id: 'P2U1C3', name: 'Counting, Induction & Discrete Probability', sessions: 3, depth: 'D3',
            terms: 'Basics of Counting, Pigeonhole Principle, Permutations and Combinations, Inclusion–Exclusion Principle, Mathematical Induction, Probability, Bayes\u2019 Theorem' },
          { id: 'P2U1C4', name: 'Group Theory', sessions: 2, depth: 'D2',
            terms: 'Groups, Subgroups, Semi Groups, Product and Quotients of Algebraic Structures, Isomorphism, Homomorphism, Automorphism, Rings, Integral Domains, Fields, Applications of Group Theory' },
          { id: 'P2U1C5', name: 'Graph Theory', sessions: 4, depth: 'D3',
            terms: 'Simple Graph, Multigraph, Weighted Graph, Paths and Circuits, Shortest Paths in Weighted Graphs, Eulerian Paths and Circuits, Hamiltonian Paths and Circuits, Planar Graph, Graph Coloring, Bipartite Graphs, Trees and Rooted Trees, Prefix Codes, Tree Traversals, Spanning Trees and Cut-Sets' },
          { id: 'P2U1C6', name: 'Boolean Algebra', sessions: 1, depth: 'D3', verify: true,
            terms: 'Boolean Functions and its Representation, Simplifications of Boolean Functions (map/K-map simplification)' },
          { id: 'P2U1C7', name: 'Optimization', sessions: 4, depth: 'D3',
            terms: 'Linear Programming — Mathematical Model, Graphical Solution, Simplex and Dual Simplex Method, Sensitive Analysis; Integer Programming; Transportation and Assignment Models; PERT-CPM — Diagram Representation, Critical Path Calculations, Resource Levelling, Cost Consideration in Project Scheduling' }
        ]
      },
      {
        id: 'P2U2', n: 2,
        name: { en: 'Computer System Architecture', bn: 'কম্পিউটার সিস্টেম আর্কিটেকচার' },
        clusters: [
          { id: 'P2U2C1', name: 'Digital Logic Circuits and Components', sessions: 3, depth: 'D3',
            terms: 'Digital Computers, Logic Gates, Boolean Algebra, Map Simplifications, Combinational Circuits, Flip-Flops, Sequential Circuits, Integrated Circuits, Decoders, Multiplexers, Registers and Counters, Memory Unit' },
          { id: 'P2U2C2', name: 'Data Representation', sessions: 3, depth: 'D3',
            terms: 'Data Types, Number Systems and Conversion, Complements, Fixed Point Representation, Floating Point Representation, Error Detection Codes, Computer Arithmetic — Addition, Subtraction, Multiplication and Division Algorithms' },
          { id: 'P2U2C3', name: 'Register Transfer and Microoperations', sessions: 2, depth: 'D2',
            terms: 'Register Transfer Language, Bus and Memory Transfers, Arithmetic, Logic and Shift Microoperations' },
          { id: 'P2U2C4', name: 'Basic Computer Organization and Design', sessions: 2, depth: 'D2',
            terms: 'Stored Program Organization and Instruction Codes, Computer Registers, Computer Instructions, Timing and Control, Instruction Cycle, Memory-Reference Instructions, Input-Output, Interrupt' },
          { id: 'P2U2C5', name: 'Programming the Basic Computer', sessions: 2, depth: 'D2',
            terms: 'Machine Language, Assembly Language, Assembler, Program Loops, Subroutines, Input-Output Programming' },
          { id: 'P2U2C6', name: 'Microprogrammed Control', sessions: 2, depth: 'D2',
            terms: 'Control Memory, Address Sequencing, Design of Control Unit' },
          { id: 'P2U2C7', name: 'Central Processing Unit', sessions: 2, depth: 'D3',
            terms: 'General Register Organization, Stack Organization, Instruction Formats, Addressing Modes, RISC Computer, CISC Computer' },
          { id: 'P2U2C8', name: 'Pipeline and Vector Processing', sessions: 1, depth: 'D2',
            terms: 'Parallel Processing, Pipelining, Arithmetic Pipeline, Instruction Pipeline, Vector Processing Array Processors' },
          { id: 'P2U2C9', name: 'Input-Output Organization', sessions: 1, depth: 'D2',
            terms: 'Peripheral Devices, Input-Output Interface, Asynchronous Data Transfer, Modes of Transfer, Priority Interrupt, DMA, Serial Communication' },
          { id: 'P2U2C10', name: 'Memory Hierarchy', sessions: 1, depth: 'D2',
            terms: 'Main Memory, Auxiliary Memory, Associative Memory, Cache Memory, Virtual Memory, Memory Management Hardware' },
          { id: 'P2U2C11', name: 'Multiprocessors', sessions: 1, depth: 'D2',
            terms: 'Characteristics of Multiprocessors, Interconnection Structures, Interprocessor Arbitration, Interprocessor Communication and Synchronization, Cache Coherence, Multicore Processors' }
        ]
      },
      {
        id: 'P2U3', n: 3,
        name: { en: 'Programming Languages and Computer Graphics', bn: 'প্রোগ্রামিং ভাষা ও কম্পিউটার গ্রাফিক্স' },
        clusters: [
          { id: 'P2U3C1', name: 'Language Design and Translation Issues', sessions: 2, depth: 'D2',
            terms: 'Programming Language Concepts, Paradigms and Models, Programming Environments, Virtual Computers and Binding Times, Programming Language Syntax, Stages in Translation, Formal Transition Models' },
          { id: 'P2U3C2', name: 'Elementary Data Types', sessions: 1, depth: 'D2',
            terms: 'Properties of Types and Objects; Scalar and Composite Data Types' },
          { id: 'P2U3C3', name: 'Programming in C', sessions: 3, depth: 'D3',
            terms: 'Tokens, Identifiers, Data Types, Sequence Control, Subprogram Control, Arrays, Structures, Union, String, Pointers, Functions, File Handling, Command Line Arguments, Preprocessors' },
          { id: 'P2U3C4', name: 'Object Oriented Programming', sessions: 2, depth: 'D2',
            terms: 'Class, Object, Instantiation, Inheritance, Encapsulation, Abstract Class, Polymorphism' },
          { id: 'P2U3C5', name: 'Programming in C++', sessions: 3, depth: 'D3',
            terms: 'Tokens, Identifiers, Variables and Constants; Data types, Operators, Control statements, Functions Parameter Passing, Virtual Functions, Class and Objects; Constructors and Destructors; Overloading, Inheritance, Templates, Exception and Event Handling; Streams and Files; Multifile Programs' },
          { id: 'P2U3C6', name: 'Web Programming', sessions: 2, depth: 'D2',
            terms: 'HTML, DHTML, XML, Scripting, Java, Servlets, Applets' },
          { id: 'P2U3C7', name: 'Computer Graphics', sessions: 2, depth: 'D3',
            terms: 'Video-Display Devices, Raster-Scan and Random-Scan Systems; Graphics Monitors, Input Devices, Points and Lines; Line Drawing Algorithms, Mid-Point Circle and Ellipse Algorithms; Scan Line Polygon Fill Algorithm, Boundary-Fill and Flood-Fill' },
          { id: 'P2U3C8', name: '2-D Geometrical Transformations and Viewing', sessions: 2, depth: 'D3',
            terms: 'Translation, Scaling, Rotation, Reflection and Shear; Matrix Representations and Homogeneous Coordinates; Composite Transforms, Transformations Between Coordinate Systems, Viewing Pipeline, Viewing Coordinate Reference Frame, Window to View-Port Coordinate Transformation, Viewing Functions, Line and Polygon Clipping Algorithms' },
          { id: 'P2U3C9', name: '3-D Object Representation, Transformations & Viewing', sessions: 1, depth: 'D2',
            terms: 'Polygon Surfaces, Quadric Surfaces, Spline Representation, Bezier and B-Spline Curves; Bezier and B-Spline Surfaces; Illumination Models, Polygon Rendering Methods, Viewing Pipeline and Coordinates; General Projection Transforms and Clipping' }
        ]
      },
      {
        id: 'P2U4', n: 4,
        name: { en: 'Database Management Systems', bn: 'ডেটাবেস ম্যানেজমেন্ট সিস্টেম' },
        clusters: [
          { id: 'P2U4C1', name: 'Database System Concepts and Architecture', sessions: 2, depth: 'D2',
            terms: 'Data Models, Schemas and Instances; Three-Schema Architecture and Data Independence; Database Languages and Interfaces; Centralized and Client/Server Architectures for DBMS' },
          { id: 'P2U4C2', name: 'Data Modeling', sessions: 2, depth: 'D2',
            terms: 'Entity-Relationship Diagram, Relational Model — Constraints, Languages, Design and Programming, Relational Database Schemas, Update Operations and Dealing with Constraint Violations; Relational Algebra and Relational Calculus; Codd Rules' },
          { id: 'P2U4C3', name: 'SQL', sessions: 2, depth: 'D3',
            terms: 'Data Definition and Data Types; Constraints, Queries, Insert, Delete, Update Statements; Views, Stored Procedures and Functions; Database Triggers, SQL Injection' },
          { id: 'P2U4C4', name: 'Normalization for Relational Databases', sessions: 3, depth: 'D3',
            terms: 'Functional Dependencies and Normalization; Algorithms for Query Processing and Optimization; Transaction Processing, Concurrency Control Techniques, Database Recovery Techniques, Object and Object-Relational Databases; Database Security and Authorization' },
          { id: 'P2U4C5', name: 'Enhanced Data Models', sessions: 2, depth: 'D2',
            terms: 'Temporal Database Concepts, Multimedia Databases, Deductive Databases, XML and Internet Databases; Mobile Databases, Geographic Information Systems, Genome Data Management, Distributed Databases and Client-Server Architectures' },
          { id: 'P2U4C6', name: 'Data Warehousing and Data Mining', sessions: 2, depth: 'D2', verify: true,
            terms: 'Data Modeling for Data Warehouses, Concept Hierarchy, OLAP and OLTP; Association Rules, Classification, Clustering, Regression, Support Vector Machine, K-Nearest Neighbour, Hidden Markov Model, Summarization, Dependency Modeling, Link Analysis, Sequencing Analysis, Social Network Analysis' },
          { id: 'P2U4C7', name: 'Big Data Systems', sessions: 2, depth: 'D2',
            terms: 'Big Data Characteristics, Types of Big Data, Big Data Architecture, Introduction to Map-Reduce and Hadoop; Distributed File System, HDFS' },
          { id: 'P2U4C8', name: 'NOSQL', sessions: 1, depth: 'D2',
            terms: 'NOSQL and Query Optimization; Different NOSQL Products, Querying and Managing NOSQL; Indexing and Ordering Data Sets; NOSQL in Cloud' }
        ]
      },
      {
        id: 'P2U5', n: 5,
        name: { en: 'System Software and Operating System', bn: 'সিস্টেম সফটওয়্যার ও অপারেটিং সিস্টেম' },
        clusters: [
          { id: 'P2U5C1', name: 'System Software', sessions: 2, depth: 'D2',
            terms: 'Machine, Assembly and High-Level Languages; Compilers and Interpreters; Loading, Linking and Relocation; Macros, Debuggers' },
          { id: 'P2U5C2', name: 'Basics of Operating Systems', sessions: 1, depth: 'D2',
            terms: 'Operating System Structure, Operations and Services; System Calls, Operating-System Design and Implementation; System Boot' },
          { id: 'P2U5C3', name: 'Process Management', sessions: 2, depth: 'D3',
            terms: 'Process Scheduling and Operations; Interprocess Communication, Communication in Client–Server Systems, Process Synchronization, Critical-Section Problem, Peterson\u2019s Solution, Semaphores, Synchronization' },
          { id: 'P2U5C4', name: 'Threads', sessions: 1, depth: 'D2',
            terms: 'Multicore Programming, Multithreading Models, Thread Libraries, Implicit Threading, Threading Issues' },
          { id: 'P2U5C5', name: 'CPU Scheduling', sessions: 2, depth: 'D3',
            terms: 'Scheduling Criteria and Algorithms; Thread Scheduling, Multiple-Processor Scheduling, Real-Time CPU Scheduling' },
          { id: 'P2U5C6', name: 'Deadlocks', sessions: 2, depth: 'D3',
            terms: 'Deadlock Characterization, Methods for Handling Deadlocks, Deadlock Prevention, Avoidance and Detection; Recovery from Deadlock' },
          { id: 'P2U5C7', name: 'Memory Management', sessions: 3, depth: 'D3',
            terms: 'Contiguous Memory Allocation, Swapping, Paging, Segmentation, Demand Paging, Page Replacement, Allocation of Frames, Thrashing, Memory-Mapped Files' },
          { id: 'P2U5C8', name: 'Storage Management', sessions: 1, depth: 'D2',
            terms: 'Mass-Storage Structure, Disk Structure, Scheduling and Management, RAID Structure' },
          { id: 'P2U5C9', name: 'File and Input/Output Systems', sessions: 2, depth: 'D2',
            terms: 'Access Methods, Directory and Disk Structure; File-System Mounting, File Sharing, File-System Structure and Implementation; Directory Implementation, Allocation Methods, Free-Space Management, Efficiency and Performance; Recovery, I/O Hardware, Application I/O Interface, Kernel I/O Subsystem, Transforming I/O Requests to Hardware Operations' },
          { id: 'P2U5C10', name: 'Security', sessions: 1, depth: 'D2',
            terms: 'Protection, Access Matrix, Access Control, Revocation of Access Rights, Program Threats, System and Network Threats; Cryptography as a Security Tool, User Authentication, Implementing Security Defenses' },
          { id: 'P2U5C11', name: 'Virtual Machines', sessions: 1, depth: 'D2',
            terms: 'Types of Virtual Machines and Implementations; Virtualization' },
          { id: 'P2U5C12', name: 'Linux Operating Systems', sessions: 1, depth: 'D2',
            terms: 'Design Principles, Kernel Modules, Process Management, Scheduling, Memory Management, File Systems, Input and Output; Interprocess Communication, Network Structure' },
          { id: 'P2U5C13', name: 'Windows OS & Distributed Systems', sessions: 1, depth: 'D2',
            terms: 'Windows: Design Principles, System Components, Terminal Services and Fast User Switching; File System, Networking. Distributed Systems: Types of Network based OS, Network Structure, Communication Structure and Protocols; Robustness, Design Issues, Distributed File Systems' }
        ]
      },
      {
        id: 'P2U6', n: 6,
        name: { en: 'Software Engineering', bn: 'সফটওয়্যার ইঞ্জিনিয়ারিং' },
        clusters: [
          { id: 'P2U6C1', name: 'Software Process Models', sessions: 3, depth: 'D2',
            terms: 'Software Process, Generic Process Model — Framework Activity, Task Set and Process Patterns; Process Lifecycle, Prescriptive Process Models, Project Management, Component Based Development, Aspect-Oriented Software Development, Formal Methods, Agile Process Models — XP, Adaptive Software Development, Scrum, Dynamic System Development Model, Feature Driven Development, Crystal, Web Engineering' },
          { id: 'P2U6C2', name: 'Software Requirements', sessions: 2, depth: 'D2',
            terms: 'Functional and Non-Functional Requirements; Eliciting Requirements, Developing Use Cases, Requirement Analysis and Modelling; Requirements Review, Software Requirement and Specification (SRS) Document' },
          { id: 'P2U6C3', name: 'Software Design', sessions: 2, depth: 'D2',
            terms: 'Abstraction, Architecture, Patterns, Separation of Concerns, Modularity, Information Hiding, Functional Independence, Cohesion and Coupling; Object-Oriented Design, Data Design, Architectural Design, User Interface Design, Component Level Design' },
          { id: 'P2U6C4', name: 'Software Quality', sessions: 1, depth: 'D2',
            terms: 'McCalls Quality Factors, ISO 9126 Quality Factors, Quality Control, Quality Assurance, Risk Management, Risk Mitigation, Monitoring and Management (RMMM); Software Reliability' },
          { id: 'P2U6C5', name: 'Estimation and Scheduling of Software Projects', sessions: 2, depth: 'D3',
            terms: 'Software Sizing, LOC and FP based Estimations; Estimating Cost and Effort; Estimation Models, Constructive Cost Model (COCOMO), Project Scheduling and Staffing; Time-line Charts' },
          { id: 'P2U6C6', name: 'Software Testing', sessions: 2, depth: 'D3',
            terms: 'Verification and Validation; Error, Fault, Bug and Failure; Unit and Integration Testing; White-box and Black-box Testing; Basis Path Testing, Control Structure Testing, Deriving Test Cases, Alpha and Beta Testing; Regression Testing, Performance Testing, Stress Testing' },
          { id: 'P2U6C7', name: 'Software Configuration Management', sessions: 1, depth: 'D2',
            terms: 'Change Control and Version Control; Software Reuse, Software Re-engineering, Reverse Engineering' }
        ]
      },
      {
        id: 'P2U7', n: 7,
        name: { en: 'Data Structures and Algorithms', bn: 'ডেটা স্ট্রাকচার ও অ্যালগরিদম' },
        clusters: [
          { id: 'P2U7C1', name: 'Data Structures', sessions: 3, depth: 'D3',
            terms: 'Arrays and their Applications; Sparse Matrix, Stacks, Queues, Priority Queues, Linked Lists, Trees, Forest, Binary Tree, Threaded Binary Tree, Binary Search Tree, AVL Tree, B Tree, B+ Tree, B* Tree, Data Structure for Sets, Graphs, Sorting and Searching Algorithms; Hashing' },
          { id: 'P2U7C2', name: 'Performance Analysis and Recurrences', sessions: 2, depth: 'D3',
            terms: 'Time and Space Complexities; Asymptotic Notation, Recurrence Relations' },
          { id: 'P2U7C3', name: 'Design Techniques', sessions: 2, depth: 'D3',
            terms: 'Divide and Conquer; Dynamic Programming, Greedy Algorithms, Backtracking, Branch and Bound' },
          { id: 'P2U7C4', name: 'Lower Bound Theory', sessions: 1, depth: 'D3',
            terms: 'Comparison Trees, Lower Bounds through Reductions' },
          { id: 'P2U7C5', name: 'Graph Algorithms', sessions: 2, depth: 'D3',
            terms: 'Breadth-First Search, Depth-First Search, Shortest Paths, Maximum Flow, Minimum Spanning Trees' },
          { id: 'P2U7C6', name: 'Complexity Theory', sessions: 2, depth: 'D2',
            terms: 'P and NP Class Problems; NP-completeness and Reducibility' },
          { id: 'P2U7C7', name: 'Selected Topics', sessions: 2, depth: 'D3',
            terms: 'Number Theoretic Algorithms, Polynomial Arithmetic, Fast Fourier Transform, String Matching Algorithms' },
          { id: 'P2U7C8', name: 'Advanced Algorithms', sessions: 2, depth: 'D2',
            terms: 'Parallel Algorithms for Sorting, Searching and Merging, Approximation Algorithms, Randomized Algorithms' }
        ]
      },
      {
        id: 'P2U8', n: 8,
        name: { en: 'Theory of Computation and Compilers', bn: 'থিওরি অফ কম্পিউটেশন ও কম্পাইলার' },
        clusters: [
          { id: 'P2U8C1', name: 'Theory of Computation', sessions: 1, depth: 'D2',
            terms: 'Formal Language, Non-Computational Problems, Diagonal Argument, Russells Paradox' },
          { id: 'P2U8C2', name: 'Regular Language Models', sessions: 3, depth: 'D3',
            terms: 'Deterministic Finite Automaton (DFA), Non-Deterministic Finite Automaton (NDFA), Equivalence of DFA and NDFA, Regular Languages, Regular Grammars, Regular Expressions, Properties of Regular Language, Pumping Lemma, Non-Regular Languages, Lexical Analysis' },
          { id: 'P2U8C3', name: 'Context Free Language', sessions: 3, depth: 'D3',
            terms: 'Pushdown Automaton (PDA), Non-Deterministic Pushdown Automaton (NPDA), Context Free Grammar, Chomsky Normal Form, Greibach Normal Form, Ambiguity, Parse Tree Representation of Derivation Trees, Equivalence of PDA\u2019s and Context Free Grammars; Properties of Context Free Language' },
          { id: 'P2U8C4', name: 'Turing Machines', sessions: 3, depth: 'D3',
            terms: 'Standard Turing Machine and its Variations; Universal Turing Machines, Models of Computation and Church-Turing Thesis; Recursive and Recursively-Enumerable Languages; Context-Sensitive Languages, Unrestricted Grammars, Chomsky Hierarchy of Languages, Construction of TM for Simple Problems' },
          { id: 'P2U8C5', name: 'Unsolvable Problems and Complexity', sessions: 2, depth: 'D2',
            terms: 'Unsolvable Problem, Halting Problem, Post Correspondence Problem, Unsolvable Problems for Context-Free Languages, Measuring and Classifying Complexity, Tractable and Intractable Problems' },
          { id: 'P2U8C6', name: 'Syntax Analysis', sessions: 3, depth: 'D3',
            terms: 'Associativity, Precedence, Grammar Transformations, Top Down Parsing, Recursive Descent Predictive Parsing, LL(1) Parsing, Bottom up Parsing, LR Parser, LALR(1) Parser' },
          { id: 'P2U8C7', name: 'Semantic Analysis', sessions: 1, depth: 'D2',
            terms: 'Attribute Grammar, Syntax Directed Definitions, Inherited and Synthesized Attributes; Dependency Graph, Evaluation Order, S-attributed and L-attributed Definitions; Type-Checking' },
          { id: 'P2U8C8', name: 'Run Time System', sessions: 1, depth: 'D2',
            terms: 'Storage Organization, Activation Tree, Activation Record, Stack Allocation of Activation Records, Parameter Passing Mechanisms, Symbol Table' },
          { id: 'P2U8C9', name: 'Intermediate & Object Code Generation', sessions: 1, depth: 'D2',
            terms: 'Intermediate Representations, Translation of Declarations, Assignments, Control Flow, Boolean Expressions and Procedure Calls; Code Generation and Code Optimization — Control-flow, Data-flow Analysis, Local and Global Optimization, Loop Optimization, Peep-Hole Optimization, Instruction Scheduling' }
        ]
      },
      {
        id: 'P2U9', n: 9,
        name: { en: 'Data Communication and Computer Networks', bn: 'ডেটা কমিউনিকেশন ও কম্পিউটার নেটওয়ার্ক' },
        clusters: [
          { id: 'P2U9C1', name: 'Data Communication', sessions: 2, depth: 'D3',
            terms: 'Components of a Data Communication System, Simplex, Half-Duplex and Duplex Modes; Analog and Digital Signals; Noiseless and Noisy Channels; Bandwidth, Throughput and Latency; Digital and Analog Transmission; Data Encoding and Modulation Techniques; Broadband and Baseband Transmission; Multiplexing, Transmission Media, Transmission Errors, Error Handling Mechanisms' },
          { id: 'P2U9C2', name: 'Computer Networks', sessions: 1, depth: 'D2',
            terms: 'Network Topologies, LAN, MAN, WAN, Wireless Networks, Internet' },
          { id: 'P2U9C3', name: 'Network Models', sessions: 2, depth: 'D3',
            terms: 'Layered Architecture, OSI Reference Model and its Protocols; TCP/IP Protocol Suite, Physical, Logical, Port and Specific Addresses; Switching Techniques' },
          { id: 'P2U9C4', name: 'Functions of OSI and TCP/IP Layers', sessions: 3, depth: 'D3',
            terms: 'Framing, Error Detection and Correction; Flow and Error Control; Sliding Window Protocol, HDLC, Multiple Access — CSMA/CD, CSMA/CA, Reservation, Polling, Token Passing, FDMA, CDMA, TDMA; Network Devices, Backbone Networks, Virtual LANs; IPv4 Structure and Address Space; Classful and Classless Addressing; Datagram, Fragmentation and Checksum; IPv6 Packet Format; ARP, Direct and Indirect Network Layer Delivery; Routing Algorithms, TCP, UDP and SCTP Protocols; Flow, Error and Congestion Control in TCP and SCTP' },
          { id: 'P2U9C5', name: 'World Wide Web', sessions: 1, depth: 'D2',
            terms: 'Uniform Resource Locator (URL), Domain Name Service (DNS), Resolution — Mapping Names to Addresses and Addresses to Names; Electronic Mail Architecture, SMTP, POP and IMAP; TELNET and FTP' },
          { id: 'P2U9C6', name: 'Network Security', sessions: 2, depth: 'D2',
            terms: 'Malwares, Cryptography and Steganography; Secret-Key Algorithms, Public-Key Algorithms, Digital Signature, Virtual Private Networks, Firewalls' },
          { id: 'P2U9C7', name: 'Mobile Technology', sessions: 2, depth: 'D2',
            terms: 'GSM and CDMA; Services and Architecture of GSM and Mobile Computing; Middleware and Gateway for Mobile Computing; Mobile IP and Mobile Communication Protocol; Communication Satellites, Wireless Networks and Topologies; Cellular Topology, Mobile Adhoc Networks, Wireless Transmission and Wireless LANs; Wireless Geolocation Systems, GPRS and SMS' },
          { id: 'P2U9C8', name: 'Cloud Computing and IoT', sessions: 2, depth: 'D2',
            terms: 'SaaS, PaaS, IaaS, Public and Private Cloud; Virtualization, Virtual Server, Cloud Storage, Database Storage, Resource Management, Service Level Agreement, Basics of IoT' }
        ]
      },
      {
        id: 'P2U10', n: 10,
        name: { en: 'Artificial Intelligence', bn: 'কৃত্রিম বুদ্ধিমত্তা' },
        clusters: [
          { id: 'P2U10C1', name: 'Approaches to AI', sessions: 2, depth: 'D2',
            terms: 'Turing Test and Rational Agent Approaches; State Space Representation of Problems, Heuristic Search Techniques, Game Playing, Min-Max Search, Alpha Beta Cutoff Procedures' },
          { id: 'P2U10C2', name: 'Knowledge Representation', sessions: 1, depth: 'D2',
            terms: 'Logic, Semantic Networks, Frames, Rules, Scripts, Conceptual Dependency and Ontologies; Expert Systems, Handling Uncertainty in Knowledge' },
          { id: 'P2U10C3', name: 'Planning', sessions: 1, depth: 'D2',
            terms: 'Components of a Planning System, Linear and Non Linear Planning; Goal Stack Planning, Hierarchical Planning, STRIPS, Partial Order Planning' },
          { id: 'P2U10C4', name: 'Natural Language Processing', sessions: 1, depth: 'D2',
            terms: 'Grammar and Language; Parsing Techniques, Semantic Analysis and Pragmatics' },
          { id: 'P2U10C5', name: 'Multi Agent Systems', sessions: 1, depth: 'D2',
            terms: 'Agents and Objects; Agents and Expert Systems; Generic Structure of Multiagent System, Semantic Web, Agent Communication, Knowledge Sharing using Ontologies, Agent Development Tools' },
          { id: 'P2U10C6', name: 'Fuzzy Sets', sessions: 2, depth: 'D2',
            terms: 'Notion of Fuzziness, Membership Functions, Fuzzification and Defuzzification; Operations on Fuzzy Sets, Fuzzy Functions and Linguistic Variables; Fuzzy Relations, Fuzzy Rules and Fuzzy Inference; Fuzzy Control System and Fuzzy Rule Based Systems' },
          { id: 'P2U10C7', name: 'Genetic Algorithms', sessions: 1, depth: 'D2',
            terms: 'Encoding Strategies, Genetic Operators, Fitness Functions and GA Cycle; Problem Solving using GA' },
          { id: 'P2U10C8', name: 'Artificial Neural Networks', sessions: 1, depth: 'D2',
            terms: 'Supervised, Unsupervised and Reinforcement Learning; Single Perceptron, Multi Layer Perceptron, Self Organizing Maps, Hopfield Network' }
        ]
      }
    ]
  }
];

/* ---------------- helpers ---------------- */

export function cloneSyllabus() {
  return JSON.parse(JSON.stringify(PAPERS));
}

export function orderedUnits(paper, order) {
  if (paper.id !== 'P2' || !order || !order.length) return paper.units.slice();
  const byId = new Map(paper.units.map((u) => [u.id, u]));
  const out = [];
  order.forEach((id) => { if (byId.has(id)) { out.push(byId.get(id)); byId.delete(id); } });
  // append any units the user added and that are not in the order list
  paper.units.forEach((u) => { if (byId.has(u.id)) out.push(u); });
  return out;
}

export function findUnit(syllabus, unitId) {
  for (const p of syllabus) {
    const u = p.units.find((x) => x.id === unitId);
    if (u) return { paper: p, unit: u };
  }
  return null;
}

export function findCluster(syllabus, clusterId) {
  for (const p of syllabus) {
    for (const u of p.units) {
      const c = u.clusters.find((x) => x.id === clusterId);
      if (c) return { paper: p, unit: u, cluster: c };
    }
  }
  return null;
}

export function clusterSessions(syllabus, clusterId) {
  const f = findCluster(syllabus, clusterId);
  return f ? f.cluster.sessions : 0;
}

export function paperSessionCount(paper) {
  return paper.units.reduce((s, u) => s + u.clusters.reduce((a, c) => a + (c.sessions || 0), 0), 0);
}

export function syllabusTotals(syllabus) {
  return {
    p1: paperSessionCount(syllabus[0]),
    p2: paperSessionCount(syllabus[1]),
    total: syllabus.reduce((s, p) => s + paperSessionCount(p), 0)
  };
}

export function clusterCount(syllabus) {
  return syllabus.reduce((s, p) => s + p.units.reduce((a, u) => a + u.clusters.length, 0), 0);
}

export function flattenClusters(syllabus) {
  const out = [];
  syllabus.forEach((p) => p.units.forEach((u) => u.clusters.forEach((c) => out.push({
    paper: p.id, paperShort: p.short, unitId: u.id, unitName: u.name, unitN: u.n, cluster: c
  }))));
  return out;
}
