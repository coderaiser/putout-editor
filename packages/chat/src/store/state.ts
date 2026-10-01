import type {CommandResult} from '@putout/editor-commands';

export interface Message {
    id: number;
    
    /** The line the user sent, verbatim, `input` for a command. */
    text: string;
    
    /** What the command answered, `null` for a line that is still running. */
    result: CommandResult | null;
}
