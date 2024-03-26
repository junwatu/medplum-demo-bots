import { BotEvent, MedplumClient, getQuestionnaireAnswers, SNOMED } from '@medplum/core';
import { QuestionnaireResponse, Condition } from '@medplum/fhirtypes';

export async function handler(medplum: MedplumClient, event: BotEvent): Promise<any> {
	const response = event.input as QuestionnaireResponse;
	const answers = getQuestionnaireAnswers(response);
	console.log(JSON.stringify(answers));

	/**
	 * json response example
	 * 
	 {"patientId":{"valueString":"5d2e62de-af40-400a-87af-35ac0b03b256"},"conditionName":{"valueString":"Psoriasis"},"code":{"valueString":"9014002"},"date":{"valueDate":"2024-03-07"},"comments":{"valueString":"Topical treatments ongoing, periodic phototherapy sessions"}}
	 * 
	 */

	// Read out the the user's answers into separate variables
	// Here we provide default answers if the user's answer is 'undefined'
	const patientId = answers['patientId']?.valueString || 'No patient ID given';
	const conditionName = answers['conditionName']?.valueString || 'No condition name given';
	const snomedCode = answers['code']?.valueString || 'No SNOMED code given';
	const date = answers['date']?.valueString || new Date().toISOString();
	const comments = answers['comments']?.valueString || 'No comments given';

	const condition = await medplum.createResource<Condition>({
		resourceType: "Condition",
		subject: {
			reference: `Patient/${patientId}`
		},
		recordedDate: date,
		code: {
			coding: [
				{
					system: SNOMED,
					code: snomedCode,
					display: conditionName
				}
			]
		},
		clinicalStatus: {
			text: "Active",
			coding: [
				{
					system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
					code: "active",
					display: "Active"
				}
			]
		},
		verificationStatus: {
			coding: [
				{
					system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
					code: "confirmed",
					display: "Confirmed"
				}
			]
		},
		category: [
			{
				coding: [
					{
						system: 'http://terminology.hl7.org/CodeSystem/condition-category',
						code: 'problem-list-item',
						display: 'Problem List Item',
					},
				],
				text: 'Problem List Item',
			},
		],
		note: [
			{
				text: comments
			}
		]
	}
	)
	console.log('Created condition: ', JSON.stringify(condition));
}