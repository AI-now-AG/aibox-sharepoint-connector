/**
 * Subtitle parsing utilities for SRT and ASS formats
 */

export interface DialogueEntry {
  start: string;
  end: string;
  text: string;
  style?: string;
  position?: string;
  layer?: string;
  name?: string;
  marginL?: string;
  marginR?: string;
  marginV?: string;
  effect?: string;
}

/**
 * Parse ASS (Advanced SubStation Alpha) subtitle content
 * @param content - The raw ASS file content
 * @returns Array of dialogue entries
 */
export function parseASSContent(content: string): DialogueEntry[] {
  const lines = content.split(/\r?\n/);
  const dialogues: DialogueEntry[] = [];
  let inEvents = false;
  let assFormat: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('[Events]')) {
      inEvents = true;
      continue;
    }
    
    if (inEvents) {
      if (trimmedLine.startsWith('Format:')) {
        // Extract format from line like "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"
        assFormat = trimmedLine.substring(7).split(',').map(item => item.trim());
        continue;
      }
      
      if (trimmedLine.startsWith('Dialogue:')) {
        const data = splitASSDialogue(trimmedLine);
        if (data && assFormat.length > 0) {
          const dialogue: DialogueEntry = {
            start: '',
            end: '',
            text: ''
          };
          
          // Map data to format fields
          for (let i = 0; i < assFormat.length && i < data.length; i++) {
            const key = assFormat[i].toLowerCase();
            const value = data[i] ? data[i].trim() : '';
            
            switch (key) {
              case 'start':
                dialogue.start = value;
                break;
              case 'end':
                dialogue.end = value;
                break;
              case 'text':
                // Handle position tags and convert line breaks
                let text = value;
                
                // Extract position if present
                const posMatch = text.match(/\{\\?pos\((\d+),\\?(\d+)\)\}/);
                if (posMatch) {
                  dialogue.position = `${posMatch[1]},${posMatch[2]}`;
                  text = text.replace(/\{\\?pos\(\d+,\\?\d+\)\}/, '').trim();
                }
                
                // Remove other tags
                if (text.startsWith('{')) {
                  text = text.slice(text.indexOf('}') + 1);
                }
                
                // Convert \N and \n to actual line breaks
                text = text.replace(/\\N/g, '\n').replace(/\\n/g, '\n');
                dialogue.text = text;
                break;
              case 'style':
                dialogue.style = value;
                break;
              case 'layer':
                dialogue.layer = value;
                break;
              case 'name':
                dialogue.name = value;
                break;
              case 'marginl':
                dialogue.marginL = value;
                break;
              case 'marginr':
                dialogue.marginR = value;
                break;
              case 'marginv':
                dialogue.marginV = value;
                break;
              case 'effect':
                dialogue.effect = value;
                break;
            }
          }
          
          dialogues.push(dialogue);
        }
      }
    }
  }

  return dialogues;
}

/**
 * Parse SRT (SubRip) subtitle content
 * @param content - The raw SRT file content
 * @returns Array of dialogue entries
 */
export function parseSRTContent(content: string): DialogueEntry[] {
  const blocks = content.split(/\n\s*\n/);
  const dialogues: DialogueEntry[] = [];

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length >= 3) {
      // Skip the sequence number (first line)
      const timeLine = lines[1];
      const timeParts = timeLine.split(' --> ');
      
      if (timeParts.length === 2) {
        const start = convertSRTTimeToASS(timeParts[0]);
        const end = convertSRTTimeToASS(timeParts[1]);
        const text = lines.slice(2).join('\n');

        dialogues.push({
          start,
          end,
          text: text.replace(/<[^>]*>/g, '') // Remove HTML tags
        });
      }
    }
  }

  return dialogues;
}

/**
 * Convert SRT time format (HH:MM:SS,mmm) to ASS format (H:MM:SS.cc)
 * @param srtTime - Time in SRT format
 * @returns Time in ASS format
 */
export function convertSRTTimeToASS(srtTime: string): string {
  // SRT: 00:01:30,500 -> ASS: 0:01:30.50
  return srtTime.replace(',', '.').replace(/^0+:/, '0:').replace(/\.(\d{3})$/, (match, ms) => {
    // Convert milliseconds to centiseconds
    return '.' + ms.substring(0, 2);
  });
}

/**
 * Convert ASS time format (H:MM:SS.cc) to SRT format (HH:MM:SS,mmm)
 * @param assTime - Time in ASS format
 * @returns Time in SRT format
 */
export function convertASSTimeToSRT(assTime: string): string {
  // ASS: 0:01:30.50 -> SRT: 00:01:30,500
  const parts = assTime.split(':');
  if (parts.length === 3) {
    const hours = parts[0].padStart(2, '0');
    const minutes = parts[1];
    const secondsParts = parts[2].split('.');
    const seconds = secondsParts[0];
    const centiseconds = secondsParts[1] || '00';
    const milliseconds = centiseconds.padEnd(3, '0');
    
    return `${hours}:${minutes}:${seconds},${milliseconds}`;
  }
  return assTime;
}

/**
 * Split ASS Dialogue line correctly handling commas within the text field
 * @param line - The dialogue line from ASS file
 * @returns Array of dialogue parts
 */
function splitASSDialogue(line: string): string[] | null {
  const prefix = 'Dialogue: ';
  if (!line.startsWith(prefix)) return null;
  
  line = line.substring(prefix.length);
  const parts: string[] = [];
  let current = '';
  let count = 0;
  
  for (let i = 0; i < line.length; i++) {
    if (line[i] === ',' && count < 9) { // Split only at the first 9 commas
      parts.push(current);
      current = '';
      count++;
    } else {
      current += line[i];
    }
  }
  parts.push(current); // Text field (10th part)
  
  return parts;
}

/**
 * Generate ASS content from dialogue entries
 * @param dialogues - Array of dialogue entries
 * @param title - Title for the ASS file
 * @returns Complete ASS file content
 */
export function generateASSContent(dialogues: DialogueEntry[], title: string = 'Generated Subtitles'): string {
  let assContent = `[Script Info]
Title: ${title}
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H64000000,0,0,0,0,100,100,0,0,1,1,1,2,40,40,20,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  dialogues.forEach(dialogue => {
    const layer = dialogue.layer || '0';
    const start = dialogue.start || '0:00:00.00';
    const end = dialogue.end || '0:00:00.00';
    const style = dialogue.style || 'Default';
    const name = dialogue.name || '';
    const marginL = dialogue.marginL || '0';
    const marginR = dialogue.marginR || '0';
    const marginV = dialogue.marginV || '0';
    const effect = dialogue.effect || '';
    
    let text = dialogue.text || '';
    
    // Convert line breaks to ASS format
    text = text.replace(/\n/g, '\\N').replace(/\r/g, '');
    
    // Add position if present
    if (dialogue.position) {
      text = `{\\pos(${dialogue.position})}${text}`;
    }
    
    assContent += `Dialogue: ${layer},${start},${end},${style},${name},${marginL},${marginR},${marginV},${effect},${text}\n`;
  });

  return assContent;
}

/**
 * Generate SRT content from dialogue entries
 * @param dialogues - Array of dialogue entries
 * @returns Complete SRT file content
 */
export function generateSRTContent(dialogues: DialogueEntry[]): string {
  let srtContent = '';
  
  dialogues.forEach((dialogue, index) => {
    const sequenceNumber = index + 1;
    const start = convertASSTimeToSRT(dialogue.start);
    const end = convertASSTimeToSRT(dialogue.end);
    const text = dialogue.text.replace(/\\N/g, '\n');
    
    srtContent += `${sequenceNumber}\n`;
    srtContent += `${start} --> ${end}\n`;
    srtContent += `${text}\n\n`;
  });
  
  return srtContent.trim();
}

/**
 * Convert time string to seconds
 * @param timeStr - Time in ASS format (H:MM:SS.cc)
 * @returns Time in seconds
 */
export function timeToSeconds(timeStr: string): number {
  const parts = timeStr.split(':');
  if (parts.length !== 3) return 0;
  
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  const seconds = parseFloat(parts[2]) || 0;
  
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Convert seconds to time string
 * @param seconds - Time in seconds
 * @returns Time in ASS format (H:MM:SS.cc)
 */
export function secondsToTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toFixed(2).padStart(5, '0')}`;
}
