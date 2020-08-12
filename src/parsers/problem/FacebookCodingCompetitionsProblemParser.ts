import { Sendable } from '../../models/Sendable';
import { TaskBuilder } from '../../models/TaskBuilder';
import { TestType } from '../../models/TestType';
import { htmlToElement } from '../../utils/dom';
import { Parser } from '../Parser';

export class FacebookCodingCompetitionsProblemParser extends Parser {
  public getMatchPatterns(): string[] {
    return ['https://www.facebook.com/codingcompetitions/*/problems/*'];
  }

  public async parse(url: string, html: string): Promise<Sendable> {
    const elem = htmlToElement(html);
    const task = new TaskBuilder('Facebook Coding Competitions').setUrl(url);

    let name = elem.querySelector('#content > div > div:nth-child(4) > div > div > div > div > div').textContent;
    if (name.startsWith('Problem ')) {
      name = name.substr('Problem '.length);
    }

    task.setName(name);

    const lastBreadcrumb = elem.querySelector('a + i + span');
    const breadcrumbs = lastBreadcrumb.parentElement.querySelectorAll('a, span');
    task.setCategory([...breadcrumbs].map(el => el.textContent).join(' '));

    const blocks = [...elem.querySelectorAll('a[aria-label="Download"]')].map(el => this.findNearestPre(el));
    const input = blocks[0].textContent;
    const output = blocks[1].textContent;
    task.addTest(input, output);

    const nameWithoutPrefix = name.includes(': ') ? name.split(': ').slice(1).join(': ') : name;
    const filename = nameWithoutPrefix
      .toLowerCase()
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replace(/[^a-zA-Z]+/g, '_');

    task.setInput({
      pattern: `${filename}_.*input[.]txt`,
      type: 'regex',
    });

    task.setOutput({
      fileName: `${filename}_output.txt`,
      type: 'file',
    });

    task.setTestType(TestType.MultiNumber);

    task.setTimeLimit(360000);
    task.setMemoryLimit(1024);

    return task.build();
  }

  private findNearestPre(elem: Element): HTMLPreElement {
    const innerPre = elem.querySelector('pre');

    if (innerPre !== null) {
      return innerPre;
    }

    return this.findNearestPre(elem.parentElement);
  }
}