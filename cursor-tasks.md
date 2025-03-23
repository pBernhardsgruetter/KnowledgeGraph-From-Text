# InsightGraph application

**I. Product Overview**

Product Name: InsightGraph

Product Vision: To empower users to gain deeper understanding and generate novel insights from any text by transforming it into an interactive knowledge graph.

Value Proposition:

- **Researchers:** Gain deeper insights from research papers and identify novel connections between concepts.
- **Writers:** Understand the underlying structure of their writing, identify areas for improvement, and explore new narrative possibilities.
- **Students:** Grasp complex topics more effectively by visualizing the relationships between key ideas.
- **Analysts:** Uncover hidden patterns and relationships in textual data to inform decision-making.
- **Creative thinkers:** Brainstorm new ideas and explore connections between seemingly disparate concepts. **Differentiation:** InsightGraph aims to provide a user-friendly interface for both basic co-occurrence-based analysis and advanced semantic knowledge extraction powered by Large Language Models, offering a more comprehensive understanding of text. Target Users:
- Researchers
- Writers
- Students
- Analysts
- Creative thinkers Key Features:
- Text input and processing
- Knowledge graph generation (co-occurrence and LLM-based)
- Interactive graph visualization
- Topic modeling and keyword extraction (including LDA)
- Discourse structure analysis
- Insight generation through structural gap identification and other techniques
- Text summarization and search
- Graph export and API integration

**II. Requirements Specification**

**A. Functional Requirements**

- **Text Input and Processing:**
    - Users can input text by uploading files (e.g., .txt, .pdf, .docx, .epub, .md) or pasting directly into the app.
    - The app normalizes text by lemmatizing words and removing punctuation.
    - Users can customize stop word lists, or the app can use tf-idf to suggest them.
    - Consideration for handling multilingual text input.
- **Knowledge Graph Generation:**
    - The app converts processed text into a directed graph.
    - Words (for co-occurrence) or entities (for LLM-based extraction) are represented as nodes, and co-occurrences or semantic relationships as edges.
    - The app allows for configuration of the co-occurrence window (e.g., bigrams, 4-grams) and edge weighting.
    - Consideration for allowing users to define custom relationship types.
    - **LLM-based Extraction:** The app can leverage LLMs to identify entities and relationships within the text.
- **Interactive Graph Visualization:**
    - The app displays the knowledge graph in an interactive network graph.
    - Users can zoom, pan, and manipulate the graph.
    - Nodes are sized based on betweenness centrality to indicate influential words/entities.
    - The graph uses color and layout to represent topical clusters.
    - Users can filter nodes and edges based on criteria (e.g., frequency, centrality, topic, relationship type).
    - Offer multiple graph layout algorithms for users to choose from.
    - Option to display edge labels or weights visually.
- **Topic Modeling and Keyword Extraction:**
    - The app uses a community detection algorithm to identify topical clusters.
    - The app extracts keywords based on betweenness centrality.
    - Users can view the identified topics and keywords in a separate panel.
    - The app should also offer LDA topic modeling and keyword extraction, allowing users to specify the number of topics.
    - Consider adding other keyword extraction methods (e.g., RAKE, YAKE!).
- **Discourse Structure Analysis:**
    - The app calculates metrics such as modularity, giant component size, and entropy to analyze discourse structure.
    - The app categorizes the discourse (e.g., dispersed, diversified, focused, biased) based on these metrics. (e.g., Dispersed: many small, loosely connected topics; Focused: one dominant topic).
- **Insight Generation:**
    - The app identifies structural gaps in the graph (e.g., areas with low connectivity between otherwise dense clusters).
    - The app visually highlights these gaps to the user.
    - Consider other insight generation techniques, such as identifying central bridging nodes or unexpected connections.
- **Text Summarization and Search:**
    - The app highlights text segments that are most relevant to selected nodes or topics.
    - Users can search for specific terms within the graph and the source text.
    - Consider offering extractive and potentially abstractive text summarization (if using LLMs).
    - Implement advanced search options (e.g., searching within specific topics or based on graph relationships).
- **Graph Export and API Integration:**
    - Users can export the generated graphs in common formats (e.g., JSON, GraphML, CSV for node/edge lists).
    - The app provides an API for integration with other tools. (e.g., for programmatic access to graph data or analysis functions).

**B. Non-Functional Requirements**

- **Performance:** The app should process and display graphs efficiently, even for large texts (e.g., graphs with up to 10,000 nodes should load within 5 seconds).
- **Usability:** The user interface should be intuitive and easy to navigate. User testing will be conducted to ensure usability.
- **Scalability:** The app should be able to handle a growing number of users and text inputs, potentially through cloud-based infrastructure. Consider handling up to X concurrent users and Y amount of data.
- **Reliability:** The app should be stable and provide accurate results.
- **Security:** User data and uploaded texts should be handled securely, including encryption of sensitive data and secure access controls.
- **Accessibility:** The app should be accessible to users with disabilities, adhering to WCAG guidelines.

**III. User Stories**

Here are the user stories, broken down to be approximately 1 story point each, with tasks for LLM assistance and acceptance criteria (where applicable):

**Epic: Text Input and Processing**

- **Story 1: As a user, I can upload a text file so that I can analyze its content.**
    - Tasks:
        - [ ] LLM: Provide example Python code snippets for securely handling file uploads (txt, pdf, docx, epub, md) in a web application.
        - [ ] LLM: Suggest Python libraries for parsing and extracting text content from these file formats.
    - Acceptance Criteria: The app accepts .txt, .pdf, .docx, .epub, and .md files. The content of the file is successfully extracted and displayed.
- **Story 2: As a user, I can paste text directly into the app so that I can quickly analyze short passages.**
    - Tasks:
        - [ ] LLM: Provide example JavaScript code snippets for handling text input from a textarea in a web browser.
    - Acceptance Criteria: I can paste text into a designated area, and it is correctly processed by the app.
- **Story 3: As a user, the text is normalized so that different word forms are treated as the same.**
    - Tasks:
        - [ ] LLM: Provide example Python code snippets or suggest suitable libraries (e.g., NLTK, spaCy) for lemmatization.
        - [ ] LLM: Provide regular expressions for removing common punctuation marks from text.
    - Acceptance Criteria: The app performs lemmatization on the input text, reducing words to their base form. Punctuation is removed from the text.
- **Story 4: As a user, common words are removed from the analysis so that the focus is on important terms.**
    - Tasks:
        - [ ] LLM: Provide a sample list of common English stop words.
        - [ ] LLM: Explain how to implement stop word removal in Python.
    - Acceptance Criteria: A default list of stop words is applied to the processed text, removing common words.
- **Story 5: As a user, I can customize the list of stop words so that I can fine-tune the analysis.**
    - Tasks:
        - [ ] LLM: Provide guidance on how to implement a user interface (e.g., a text area or a list with add/remove buttons) for managing stop words.
        - [ ] LLM: Suggest efficient data structures (e.g., sets) for storing and managing stop word lists.
    - Acceptance Criteria: I can add and remove words from the stop word list through the user interface. The updated stop word list is used in the analysis.
- **Story 6: As a user, stop words can be suggested automatically using tf-idf, so that the most relevant words are kept.**
    - Tasks:
        - [ ] LLM: Explain the Term Frequency-Inverse Document Frequency (tf-idf) algorithm in the context of stop word identification.
        - [ ] LLM: Provide example Python code snippets or suggest libraries (e.g., scikit-learn) for calculating tf-idf.
    - Acceptance Criteria: The app can calculate tf-idf scores for words in the text and suggest potential stop words based on low tf-idf values.

**Epic: Knowledge Graph Generation**

- **Story 7: As a developer, the app represents words as nodes in a graph so that the text can be visualized as a network.**
    - Tasks:
        - [ ] LLM: Recommend suitable Python graph data structures or libraries (e.g., NetworkX, igraph).
        - [ ] LLM: Provide example Python code snippets for creating graph nodes, potentially including attributes like word frequency.
- **Story 8: As a developer, the app creates connections between words based on co-occurrence so that relationships between words are captured.**
    - Tasks:
        - [ ] LLM: Explain the concept of co-occurrence analysis in text.
        - [ ] LLM: Provide example Python code snippets for iterating through the processed text and creating graph edges between co-occurring words, including assigning weights based on frequency.
- **Story 9: As a developer, the app considers words within a window so that proximity is taken into account.**
    - Tasks:
        - [ ] LLM: Provide example Python code snippets for implementing a sliding window algorithm to identify co-occurring words.
        - [ ] LLM: Explain how to handle different window sizes (e.g., bigrams with a window of 2, 4-grams with a window of 4).
- **Story 10: As a developer, the app assigns weights to connections based on proximity so that closer words have stronger relationships.**
    - Tasks:
        - [ ] LLM: Provide example Python code snippets for assigning edge weights based on the distance between co-occurring words within the window. (e.g., closer words have a higher weight).
- **Story 11: As a developer, the app can link the last word of a paragraph to the first word of the next paragraph.**
    - Tasks:
        - [ ] LLM: Provide example Python code snippets for identifying paragraph boundaries in the input text.
        - [ ] LLM: Explain how to create edges between the last word of one paragraph and the first word of the subsequent paragraph.

**Epic: Advanced Knowledge Graph Extraction with LLMs**

- **Story 31: As a user, the app can extract key entities from the text using an LLM so that important actors and concepts are identified.**
    - Tasks:
        - [ ] LLM: Recommend suitable LLMs or Python NLP libraries (e.g., spaCy, Hugging Face Transformers) for Named Entity Recognition (NER).
        - [ ] LLM: Provide example Python code snippets for performing NER on the input text and extracting entities.
        - [ ] LLM: Suggest how to represent entities as nodes in the knowledge graph, potentially with entity type as an attribute.
    - Acceptance Criteria: The app identifies and extracts key entities (e.g., people, organizations, locations) from the text using an LLM. These entities are represented as nodes in the graph.
- **Story 32: As a user, the app can identify relationships between entities using an LLM so that the connections between key concepts are understood.**
    - Tasks:
        - [ ] LLM: Explain different approaches to relationship extraction using LLMs (e.g., using transformer models for relation classification).
        - [ ] LLM: Provide example Python code snippets for extracting relationships between identified entities and representing them as labeled edges in the graph.
        - [ ] LLM: Suggest how to handle different types of relationships (e.g., "is a," "works at," "located in").
    - Acceptance Criteria: The app identifies and extracts relationships between key entities using an LLM. These relationships are represented as labeled edges in the graph.
- **Story 33: As a user, I can configure the types of entities and relationships the LLM should extract so that I can focus on specific aspects of the text.**
    - Tasks:
        - [ ] LLM: Provide guidance on how to create a user interface for configuring entity types (e.g., checkboxes for Person, Organization, Location) and potentially specific relationship types to extract.
        - [ ] LLM: Explain how to prompt or fine-tune an LLM (if applicable) to focus on extracting specific types of entities and relationships based on user configuration.
    - Acceptance Criteria: I can select specific entity types and (optionally) relationship types that the LLM should focus on during extraction. The generated graph reflects these selections.
- **Story 34: As a user, the app can link extracted entities to external knowledge bases (e.g., Wikidata, DBpedia) using an LLM so that I can get more context about the entities.**
    - Tasks:
        - [ ] LLM: Recommend LLMs or Python libraries (e.g., using APIs of knowledge bases or specialized entity linking libraries) that support entity linking.
        - [ ] LLM: Provide example Python code snippets for linking extracted entities to external knowledge base identifiers.
        - [ ] LLM: Suggest how to display the linked information (e.g., a tooltip or a separate panel) in the app when a user interacts with an entity node.
    - Acceptance Criteria: The app attempts to link extracted entities to entries in external knowledge bases. I can view information from these knowledge bases associated with the entities.

**Epic: Interactive Graph Visualization**

- **Story 12: As a user, the knowledge graph is displayed interactively so that I can explore the text's structure.**
    - Tasks:
        - [ ] LLM: Recommend popular JavaScript libraries for network graph visualization in web browsers (e.g., Cytoscape.js, Sigma.js, Vis.js).
        - [ ] LLM: Provide basic example JavaScript code snippets for rendering a simple graph (nodes and edges) using one of the recommended libraries.
- **Story 13: As a user, I can zoom and pan the graph so that I can navigate large networks.**
    - Tasks:
        - [ ] LLM: Show how to implement zoom and pan functionality using the chosen JavaScript visualization library's API.
- **Story 14: As a user, nodes are sized based on their importance so that I can quickly identify key terms.**
    - Tasks:
        - [ ] LLM: Explain the concept of betweenness centrality in graph analysis.
        - [ ] LLM: Provide example Python code snippets or suggest libraries (e.g., NetworkX) for calculating betweenness centrality of nodes in the graph.
        - [ ] LLM: Show how to dynamically set the size of nodes in the JavaScript visualization based on their betweenness centrality values.
- **Story 15: As a user, the graph uses color to represent topics so that I can easily see clusters of related words.**
    - Tasks:
        - [ ] LLM: Explain common community detection algorithms for graphs (e.g., modularity-based algorithms like the Louvain algorithm).
        - [ ] LLM: Provide example Python code snippets or suggest libraries (e.g., NetworkX, community) for performing community detection on the graph.
        - [ ] LLM: Show how to assign different colors to nodes in the JavaScript visualization based on the community they belong to.
- **Story 16: As a developer, a layout algorithm is used so that the graph is well-organized.**
    - Tasks:
        - [ ] LLM: Recommend common graph layout algorithms suitable for network visualization (e.g., ForceAtlas2, Fruchterman-Reingold, CoSE).
        - [ ] LLM: Show how to apply a chosen layout algorithm to the graph data using the JavaScript visualization library.

**(Continue with the remaining Epic and Stories from the original plan, incorporating acceptance criteria where applicable and clarifying LLM tasks as suggested.)**

**Epic: Topic Modeling and Keyword Extraction**

- **Story 17: As a developer, the app identifies groups of related words (topics) so that the main themes of the text are clear.** (Covered in Story 15)
- **Story 18: As a user, I can view the identified topics so that I can understand the text's main themes.**
    - Tasks:
        - [ ] LLM: Provide guidance on how to display topic information in the UI (e.g., a list of keywords associated with each topic).
    - Acceptance Criteria: The app displays a list of identified topics, potentially with representative keywords for each topic.
- **Story 19: As a user, the app extracts important keywords so that I can quickly grasp the text's key concepts.** (Covered in Story 14)
- **Story 20: As a user, I can view the extracted keywords so that I can see the most relevant terms.**
    - Tasks:
        - [ ] LLM: Provide guidance on how to display keyword information in the UI (e.g., a list of top keywords ranked by betweenness centrality).
    - Acceptance Criteria: The app displays a list of extracted keywords, ordered by their importance (e.g., betweenness centrality).
- **Story 21: As a user, the app also offers LDA topic modeling, so that I can compare the results.**
    - Tasks:
        - [ ] LLM: Explain the Latent Dirichlet Allocation (LDA) algorithm for topic modeling.
        - [ ] LLM: Provide example Python code snippets or suggest libraries (e.g., scikit-learn, Gensim) for performing LDA.
        - [ ] LLM: Show how to integrate the results of LDA (topics and associated keywords) into the app's UI for user viewing.
    - Acceptance Criteria: The app offers LDA as an alternative topic modeling method. I can view the topics and keywords generated by LDA. I can potentially specify the number of topics for LDA.

**Epic: Discourse Structure Analysis**

- **Story 22: As a developer, the app calculates metrics to analyze the structure of the discourse.**
    - Tasks:
        - [ ] LLM: Explain the meaning of modularity, giant component size, and entropy in the context of knowledge graphs derived from text.
        - [ ] LLM: Provide example Python code snippets or suggest libraries (e.g., NetworkX) for calculating these graph metrics.
- **Story 23: As a developer, the app categorizes the discourse based on these metrics.**
    - Tasks:
        - [ ] LLM: Provide example Python code snippets for implementing the logic that categorizes the discourse (e.g., using thresholds for modularity, giant component size, and entropy to classify as dispersed, diversified, focused, or biased).
- **Story 24: As a user, the app provides information about the discourse structure, so that I can understand the flow of the text.**
    - Tasks:
        - [ ] LLM: Provide guidance on how to present the discourse structure information in the UI (e.g., displaying the calculated metrics and the resulting category with a brief explanation of what it means).
    - Acceptance Criteria: The app displays the calculated discourse metrics (modularity, giant component size, entropy) and categorizes the discourse (e.g., dispersed, focused). A brief explanation of the category is provided.

**Epic: Insight Generation**

- **Story 25: As a developer, the app identifies structural gaps in the graph.**
    - Tasks:
        - [ ] LLM: Explain algorithms or heuristics for identifying structural gaps in a graph (e.g., identifying bridges between communities, regions with low edge density).
        - [ ] LLM: Provide example Python code snippets for structural gap detection.
- **Story 26: As a user, the app highlights structural gaps in the graph so that I can discover potential insights.**
    - Tasks:
        - [ ] LLM: Show how to visually highlight the identified structural gaps (e.g., by changing the color or thickness of edges or by outlining regions) in the graph visualization.
    - Acceptance Criteria: The app visually highlights areas of low connectivity (structural gaps) within the knowledge graph.

**Epic: Text Summarization and Search**

- **Story 27: As a user, the app highlights relevant text segments when I interact with the graph.**
    - Tasks:
        - [ ] LLM: Provide guidance on how to link user interactions with graph nodes or topics to highlighting corresponding segments in the original text.
        - [ ] LLM: Suggest methods for ranking text segments by their relevance to selected nodes or topics (e.g., based on the presence of the selected keywords or entities).
    - Acceptance Criteria: When I select a node or topic in the graph, the app highlights the corresponding relevant sections in the original input text.
- **Story 28: As a user, I can search for terms within the graph and the text.**
    - Tasks:
        - [ ] LLM: Provide example JavaScript code snippets for implementing text search functionality within the app's UI.
        - [ ] LLM: Show how to highlight the search terms both in the graph (e.g., by focusing on nodes containing the term) and in the original text.
    - Acceptance Criteria: I can enter a search term, and the app highlights all occurrences of that term in both the knowledge graph (nodes containing the term) and the original text.

**Epic: Graph Export and API Integration**

- **Story 29: As a user, I can export the generated graphs so that I can use them in other tools.**
    - Tasks:
        - [ ] LLM: Recommend common graph file formats suitable for sharing and using in other tools (e.g., JSON, GraphML, CSV for node/edge lists).
        - [ ] LLM: Provide example Python code snippets for exporting the graph data in these formats.
    - Acceptance Criteria: I can export the generated knowledge graph in JSON, GraphML, and CSV formats.
- **Story 30: As a developer, the app provides an API so that other applications can use its functionality.**
    - Tasks:
        - [ ] LLM: Provide guidance on designing and implementing a RESTful API for accessing the app's features (e.g., text processing, graph generation).
        - [ ] LLM: Suggest common API authentication methods (e.g., API keys).
    - Acceptance Criteria: The app exposes a RESTful API that allows other applications to interact with its core functionalities.

**VI. Technical Considerations**

- **Backend Technology:** Python with a framework like Flask or Django is a suitable choice for handling text processing, graph analysis, and API development.
- **Frontend Technology:** A JavaScript framework like React, Vue.js, or Angular can be used for building the interactive user interface and graph visualization.
- **Graph Database/Library:** For storing and querying the knowledge graph, consider using a graph library like NetworkX (for in-memory operations) or a dedicated graph database like Neo4j (for larger datasets and more complex queries). The choice will depend on the expected scale and complexity of the application.

**VII. Testing and Quality Assurance**

- **Epic: Testing and Quality Assurance**
    - **Story 35: As a developer, I will write unit tests for core functionalities so that the app behaves as expected.**
        - [ ] LLM: Provide guidance on writing unit tests in Python for text processing and graph manipulation functions.
        - [ ] LLM: Suggest testing frameworks for Python (e.g., unittest, pytest).
    - **Story 36: As a developer, I will write integration tests to ensure different parts of the app work together correctly.**
        - [ ] LLM: Provide guidance on writing integration tests for the backend and frontend components.
    - **Story 37: As a user, I will participate in user acceptance testing (UAT) to ensure the app meets my needs.**
        - Tasks: Define a UAT plan and scenarios.
    - **Story 38: As a developer, I can use the LLM to generate potential test cases based on the user stories and requirements.**
        - [ ] LLM: Generate a list of potential test cases for specific user stories (e.g., file upload, stop word removal).

**VIII. Deployment and Maintenance**

- **Deployment:** The application can be deployed on a cloud platform like AWS, Google Cloud, or Azure using containerization technologies like Docker. Alternatively, it can be self-hosted on a dedicated server.
- **Maintenance:** Ongoing maintenance will involve monitoring the application for bugs and performance issues, applying updates to dependencies, and potentially adding new features based on user feedback.

**IX. Iteration and Prioritization**

- **Iteration Strategy:** The application will be developed iteratively, with each iteration focusing on delivering a set of prioritized user stories. An agile methodology (e.g., Scrum) will be adopted for managing the development process.
- **Prioritization Framework:** User stories will be prioritized based on factors such as user value, technical feasibility, dependencies on other stories, and alignment with the product vision. A prioritization framework like MoSCoW (Must have, Should have, Could have, Won't have) can be used.

**X. Data Privacy and Ethics**

- **Data Handling:** User-uploaded text data will be handled with respect for privacy. Consider options for anonymization or ensuring data is not stored unnecessarily. Implement secure data storage and transmission practices.
- **LLM Usage Transparency:** If external LLM services are used, this will be clearly communicated to the users.
- **Bias in LLMs:** Be aware of potential biases in LLM outputs. Consider strategies to mitigate these biases, such as using diverse datasets or providing users with control over the LLM parameters (if applicable).
