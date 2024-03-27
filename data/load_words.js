const { createClient } = require('@supabase/supabase-js');

// Initialize the Supabase client
const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_API_KEY');

// Array of JSON objects
const wordsData = [
  {
    "answer": "building",
    "svg": {
      "content": "<svg width=\"200\" height=\"220\" xmlns=\"http://www.w3.org/2000/svg\"> <rect x=\"20\" y=\"20\" width=\"160\" height=\"200\" fill=\"#8c8c89\"/> <rect x=\"40\" y=\"40\" width=\"40\" height=\"40\" fill=\"#ffffff\"/> <rect x=\"120\" y=\"40\" width=\"40\" height=\"40\" fill=\"#ffffff\"/> <rect x=\"40\" y=\"100\" width=\"40\" height=\"40\" fill=\"#ffffff\"/> <rect x=\"120\" y=\"100\" width=\"40\" height=\"40\" fill=\"#ffffff\"/> <rect x=\"40\" y=\"160\" width=\"40\" height=\"40\" fill=\"#ffffff\"/> <rect x=\"120\" y=\"160\" width=\"40\" height=\"40\" fill=\"#ffffff\"/> <path d=\"M0 30 L20 20 L20 220\" fill=\"#7a7a78\"/> <path d=\"M200 30 L180 20 L180 220\" fill=\"#7a7a78\"/> <rect x=\"85\" y=\"30\" width=\"30\" height=\"10\" fill=\"#ffffff\"/> </svg>",
      "width": 200,
      "height": 220
    }
  },
  // More JSON objects...
];

// Map the JSON objects to match the table schema
const wordsToInsert = wordsData.map(word => ({
  word: word.answer,
  difficulty: 'easy', // You can set the difficulty based on your criteria
  svg: JSON.stringify(word.svg) // Convert the SVG object to a JSON string
}));

// Insert the words into the 'words' table
supabase
  .from('words')
  .insert(wordsToInsert)
  .then(response => {
    console.log('Words inserted successfully:', response);
  })
  .catch(error => {
    console.error('Error inserting words:', error);
  });
