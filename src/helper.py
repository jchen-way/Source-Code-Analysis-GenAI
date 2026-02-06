import os
from git import Repo
from langchain.document_loaders.generic import GenericLoader
from langchain.document_loaders.parsers import LanguageParser
from langchain.text_splitter import Language
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings.openai import OpenAIEmbeddings 

def repo_ingestion(repo_url):
    os.makedirs("repo", exist_ok=True)
    repo_path = "repo/"
    Repo.clone_from(repo_url, to_path=repo_path)

def load_repo(repo_path):
    # Add file extensions to suffix for more context
    loader = GenericLoader.from_filesystem(
        repo_path, 
        glob="**/*", 
        suffixes=[".py", ".js", ".html", ".md"], 
        parser=LanguageParser(language=Language.PYTHON, parser_threshold=500)
    )
    documents = loader.load()
    return documents

def text_splitter(documents):
    documents_splitter = RecursiveCharacterTextSplitter.from_language(
        language=Language.PYTHON,
        chunk_size=1000, # Slightly larger chunks for high level
        chunk_overlap=100
    )
    text_chunks = documents_splitter.split_documents(documents)
    return text_chunks

def load_embedding():
    embeddings = OpenAIEmbeddings(disallowed_special=())
    return embeddings