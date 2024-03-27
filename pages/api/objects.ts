// pages/api/objects.ts
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import { promises as fs } from 'fs';
import { createClient } from '@supabase/supabase-js';
interface SVG {
  content: string;
  width: number;
  height: number;
}

interface ObjectData {
  answer: string;
  svg: SVG;
}

let results;

// const loadResults = async () => {

// }/

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse<ObjectData[]>) {
  try {
    const jsonDirectory = path.join(process.cwd(), 'pages/api');
    const fileContents = fs.readFile(jsonDirectory + '/objects.json', 'utf8');
    results = await fileContents.then((data) => {console.log(data); return data;} );
    const objects: ObjectData[] = JSON.parse(results);

    objects.forEach((object) => {
      console.log(object.answer)
      console.log(object)
      supabase.from('words').insert(
        { 
          word: object.answer,
          difficulty: 'easy',
          svg: object.svg.content,
        }
      ).then((data) => {
        console.log(data);
      })
    })

    res.status(200).json(objects);
  } catch (error) {
    console.error('Error reading JSON file:', error);
    res.status(500).json([]);
  }
}