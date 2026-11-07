import assert from 'node:assert/strict';

/** Check the workflow source so an early failure cannot replace Pages with an empty report. */
export const verifyReportPublicationContract = (workflow: string): void => {
    workflow = workflow.replace(/\r\n/g, '\n');
    const step = (name: string): string => {
        const start = workflow.indexOf(`      - name: ${name}\n`);
        assert.ok(start >= 0, `Missing CI step: ${name}`);
        const end = workflow.indexOf('\n      - ', start + 1);
        return workflow.slice(start, end === -1 ? undefined : end);
    };
    assert.match(step('Verify report data exists'), /id: report-data\s/);
    assert.match(step('Verify report data exists'), /test "\$\{count\}" -gt 0/);
    assert.match(
        step('Generate living documentation'),
        /if: always\(\) && steps\.report-data\.outcome == 'success'/,
        'Rendering must require successful scenario-data verification, including after a failed test',
    );
    const upload = step('Upload Pages artifact');
    assert.match(upload, /id: upload-report\s/);
    assert.match(upload, /if: always\(\) && steps\.render\.outcome == 'success'/);
    assert.match(
        workflow,
        /report-uploaded: \$\{\{ steps\.upload-report\.outcome == 'success' \}\}/,
        'The report job output must reflect a successful upload',
    );
    const deploy = workflow.slice(workflow.indexOf('  deploy-pages:'));
    assert.match(deploy, /needs: e2e/);
    assert.match(
        deploy,
        /if: \$\{\{ always\(\) && github\.ref == 'refs\/heads\/main' && needs\.e2e\.outputs\.report-uploaded == 'true' \}\}/,
        'Pages deployment must require the uploaded-report output even when the e2e job failed',
    );
};
