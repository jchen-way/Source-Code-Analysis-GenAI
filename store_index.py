from src.helper import repo_ingestion, load_repo, text_splitter, load_embedding 
from dotenv import load_dotenv
from langchain.vectorstores import Chroma
import os
import sys

load_dotenv()

OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY

# 1. Load and Split
documents = load_repo("repo/")
text_chunks = text_splitter(documents)
embeddings = load_embedding()

# Make sure chunks exists to avoid IndexError
if not text_chunks:
    print("Error: No valid Python files found in the repository. Aborting index creation.")
    sys.exit(1)

# 3. Store vector in ChromaDB
vectordb = Chroma.from_documents(
    text_chunks, 
    embedding=embeddings, 
    persist_directory='./db'
)
vectordb.persist()
print("Success: Database created at ./db")