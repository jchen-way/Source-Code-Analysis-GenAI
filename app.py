from langchain.vectorstores import Chroma
from src.helper import load_embedding
from dotenv import load_dotenv
import os
import shutil
from src.helper import repo_ingestion
from flask import Flask, render_template, jsonify, request
from langchain.chat_models import ChatOpenAI
from langchain.memory import ConversationSummaryMemory
from langchain.chains import ConversationalRetrievalChain

app = Flask(__name__)

load_dotenv()

OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY

embeddings = load_embedding()
persist_directory = "db"

llm = ChatOpenAI()
memory = ConversationSummaryMemory(llm=llm, memory_key="chat_history", return_messages=True)
vectordb = None
qa = None

# Initialize or refresh RAG chain
def initialize_qa_chain():
    global vectordb, qa
    if os.path.exists(persist_directory):
        vectordb = Chroma(persist_directory=persist_directory, embedding_function=embeddings)
        qa = ConversationalRetrievalChain.from_llm(
            llm=llm, 
            retriever=vectordb.as_retriever(search_type="mmr", search_kwargs={"k": 3}), 
            memory=memory
        )

# Initial load on startup
initialize_qa_chain()

@app.route('/', methods=["GET", "POST"])
def index():
    return render_template('index.html')

@app.route('/chatbot', methods=["GET", "POST"])
def gitRepo():
    if request.method == 'POST':
        user_input = request.form['question']
        
        # Clear old data
        if os.path.exists("repo"):
            shutil.rmtree("repo")
        if os.path.exists("db"):
            shutil.rmtree("db")

        # Get new data from repo
        repo_ingestion(user_input)
        
        # Build new index
        os.system("python store_index.py")

        # Refresh with new DB
        initialize_qa_chain()
        # Reset memory for new repo
        memory.clear()

    return jsonify({"response": str(user_input)})

@app.route("/get", methods=["GET", "POST"])
def chat():
    msg = request.form["msg"]
    
    if not qa:
        return "Please initialize a repository first."

    if msg.lower() == "clear":
        memory.clear()
        return "Chat history cleared."

    result = qa(msg)
    return str(result["answer"])

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8080, debug=True, use_reloader=False)