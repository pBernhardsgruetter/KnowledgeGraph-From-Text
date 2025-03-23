from kg_gen import KGGen

# Initialize KGGen with optional configuration
kg = KGGen(
  model="gemini/gemini-2.0-flash", # "openai/gpt-4o",  # Default model
  temperature=0.0,        # Default temperature
  api_key="AIzaSyDKtjlDe58qlfZyYRBwmRLoGntjaw2ZZII"  # Optional if set in environment or using a local model
)

# EXAMPLE 1: Single string with context
text_input = "Linda is Josh's mother. Ben is Josh's brother. Andrew is Josh's father."
graph_1 = kg.generate(
  input_data=text_input,
  context="Family relationships"
)

print(graph_1)

# Output: 
# entities={'Linda', 'Ben', 'Andrew', 'Josh'} 
# edges={'is brother of', 'is father of', 'is mother of'} 
# relations={('Ben', 'is brother of', 'Josh'), 
#           ('Andrew', 'is father of', 'Josh'), 
#           ('Linda', 'is mother of', 'Josh')}