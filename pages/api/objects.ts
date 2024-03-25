// pages/api/objects.ts
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import { promises as fs } from 'fs';

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


export default async function handler(req: NextApiRequest, res: NextApiResponse<ObjectData[]>) {
  try {
    const jsonDirectory = path.join(process.cwd(), 'pages/api');
    const fileContents = fs.readFile(jsonDirectory + '/objects.json', 'utf8');
    results = await fileContents.then((data) => {console.log(data); return data;} );
    const objects: ObjectData[] = JSON.parse(results);

    res.status(200).json(objects);
  } catch (error) {
    console.error('Error reading JSON file:', error);
    res.status(500).json([]);
  }
}