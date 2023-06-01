// "use strict";

// const _ = require('underscore');
// const moment = require('moment');
// const uuidv1 = require('uuid').v1;
// const async = require('async');
// var fs = require('fs');
// var pdf = require('html-pdf');
// const handlebars = require('handlebars');
// const path = require('path');
// const sanitizeHtml = require('sanitize-html');

// const swag = require('../custom_modules/swag');
// swag.registerHelpers(handlebars);

// const Sequelize = require('../models').Sequelize;
// const Company = require('../models').Company;
// const User = require('../models').User;
// const Teams = require('../models').Teams;
// const Roles = require('../models').Roles;
// const Users_Teams = require('../models').Users_Teams;
// const Custom_Function_Execution_History = require('../models').Custom_Function_Execution_History;

// const Jobs = require('../models/mongo').Jobs;
// const JobStatus = require('../models/mongo').JobStatus;
// const JobStatusAlert = require('../models/mongo').JobStatusAlert;
// const JobReminder = require('../models/mongo').JobReminder;
// const Customers = require('../models/mongo').Customer;
// const CustomerCategory = require('../models/mongo').CustomerCategory;
// const CustomFields = require('../models/mongo').CustomFields;
// const Work_Flow = require('../models/mongo').WorkFlow;
// const JobTemplate = require('../models/mongo').JobTemplate;
// const Service_Contract = require('../models/mongo').Service_Contract;
// const PPM = require('../models/mongo').Ppm;
// const Asset = require('../models/mongo').Asset;
// const Recurring_Jobs = require('../models/mongo').Recurring_Jobs;
// const Estimate = require('../models/mongo').Estimate;
// const Invoice = require('../models/mongo').Invoice;
// const Job_Category = require('../models/mongo').JobCategory;
// const Invoice_Estimate_Template = require('../models/mongo').Invoice_Estimate_Template;
// const Estimate_Invoice_Reminder = require('../models/mongo').Estimate_Invoice_Reminder;
// const Invoice_Payment_Term = require('../models/mongo').Invoice_Payment_Term;
// const Invoice_Payment_Mode = require('../models/mongo').Invoice_Payment_Mode;
// const CompanyConfig = require('../models/mongo').CompanyConfiguration;
// const JobDelayAlert = require('../models/mongo').JobDelayAlert;
// const CustomerNotification = require('../models/mongo').CustomerNotification;
// const CustomerOrg = require('../models/mongo').Organization;
// const Property = require('../models/mongo').Property;
// const Territory = require('../models/mongo').Territory;
// const Workflow_Activity = require('../models/mongo').Workflow_Activity;

// const logger = require('../logger');
// const config = require('../config');

// const Notification = require('../lib/publisher');
// const Activity = require('../lib/activity');
// const Mailer = require('../lib/mailer');
// const Push_Notification = require('../lib/push_notification');
// const Util = require('../lib/util');
// const Constants = require('../lib/constants');
// const Scheduler = require('../lib/scheduler');
// const Prefix_Formatter = require('../lib/prefix');
// const custom_function_actions = require('./custom_function_action');
// const PdfGenerator = require('../lib/pdf_generator');

// const Post_Actions = require('./post_actions')

// const doInvoiceAction = async function (action_data) {

// 	var company_id = action_data.company_id;
// 	var module_name = action_data.module_name;
// 	var data_db = action_data.data_db;
// 	var actions = action_data.actions;
// 	//WORKFLOW CREATED BY
// 	var created_by = action_data.created_by;
// 	var workflow_name = action_data.workflow_name;
// 	var company_uid = action_data.company_uid;
// 	//EVENT TRIGGERED USER
// 	var user_uid = action_data.action_user_uid;
// 	var workflow_id = action_data.workflow_id;
// 	var workflow_activity_id = action_data.workflow_activity_id;
// 	var workflow_uid = action_data.workflow_uid;

// 	var invoice_uid, data;
// 	let is_job_module = false;

// 	if (module_name == 'PAYMENTS') {
// 		module_name = action_data.payment_module_name;
// 	}
// 	if (module_name == 'INVOICE') {
// 		invoice_uid = data_db.invoice_uid
// 	} else if (module_name == 'JOB') {
// 		//CREATE INVOICE BASED ON THE ESTIMATE AVAILABLE FOR THE JOB
// 		data = await Estimate.findOne({ company_id: company_id, job: data_db._id, estimate_status: "APPROVED" }, {}, {
// 			populate: [
// 				{ path: 'organization', select: "_id organization_uid organization_name organization_description organization_email organization_address is_active is_deleted" },
// 				{
// 					path: 'job', select: '_id job_uid job_title work_order_number job_priority scheduled_end_time scheduled_start_time job_status current_job_status custom_fields created_at',
// 					populate: [
// 						{ path: 'job_category', select: '_id category_name category_uid estimated_duration category_color' },
// 					]
// 				},
// 				{ path: 'customer', select: '_id customer_uid customer_first_name customer_last_name customer_company_name customer_email customer_contact_no customer_billing_address' }
// 			],
// 			sort: { updated_at: -1 },
// 			limit: 1
// 		});

// 		if (!data) {

// 			is_job_module = true;

// 			let job_data = await Jobs.findOne({ company_id: company_id, _id: data_db._id }, {}, {
// 				populate: [
// 					{ path: 'customer', select: '_id customer_uid customer_first_name customer_last_name customer_company_name customer_email customer_contact_no customer_billing_address' },
// 					{ path: 'organization', select: "_id organization_uid organization_name organization_description organization_email organization_address is_active is_deleted" }
// 				],
// 				sort: { updated_at: -1 },
// 			});

// 			let total = 0;
// 			let discount = {};
// 			let line_items = [];
// 			let tax = await Invoice_Estimate_Tax.find({ company_id: company_id, is_active: true }, "_id tax_uid tax_rate tax_name").lean() || [];

// 			if(job_data.products && job_data.products.length > 0) {
// 				for(let p of job_data.products) {
// 					let line = {
// 						product_id: p.product_id,
// 						product_uid: p.product_uid,
// 						name: p.name,
// 						product_type: p.product_type,
// 						description: p.description,
// 						brand: p.brand,
// 						specification: p.specification,
// 						has_custom_tax: p.has_custom_tax,
// 						tax: p.tax,
// 						unit_price: p.price,
// 						quantity: p.quantity,
// 						location_uid: p.location_uid,
// 						total: p.total
// 					}
// 					line_items.push(line);
// 				}
// 			}

// 			let invoice_data = {
// 				line_items: line_items,
// 				sub_total: total,
// 				total: total,
// 				discount: discount,
// 				tax: tax
// 			}

// 			let payload = await calculateLineItemDetails(invoice_data, company_id);

// 			data = {
// 				organization: job_data.organization,
// 				customer: job_data.customer._id,
// 				property: job_data.property,
// 				job: {
// 					_id: job_data._id
// 				},
// 				line_items: payload.line_items,
// 				total: payload.total,
// 				sub_total: payload.sub_total,
// 				discount: discount,
// 				tax: payload.tax
// 			}

// 		}

// 	} else if (module_name == 'ESTIMATE') {
// 		//CREATE INVOICE BASED ON THE ESTIMATE AVAILABLE FOR THE JOB
// 		data = await Estimate.findOne({ company_id: company_id, _id: data_db._id, estimate_status: "APPROVED" }, {}, {
// 			populate: [
// 				{ path: 'customer', select: '_id customer_uid customer_first_name customer_last_name customer_company_name customer_email customer_contact_no customer_billing_address' },
// 				{ path: 'organization', select: "_id organization_uid organization_name organization_description organization_email organization_address is_active is_deleted" },
// 				{
// 					path: 'job', select: '_id job_uid job_title work_order_number job_priority scheduled_end_time scheduled_start_time job_status current_job_status custom_fields created_at',
// 					populate: [
// 						{ path: 'job_category', select: '_id category_name category_uid estimated_duration category_color' },
// 					]
// 				},
// 			],
// 			limit: 1
// 		});
// 	}
// 	let company_details = await Company.findOne({ where: { company_id: company_id }, raw: true });

// 	if (module_name == 'INVOICE') {
// 		data = await Invoice.findOne({ company_id: company_id, invoice_uid: invoice_uid }, {}, {
// 			populate: [
// 				{
// 					path: 'job', select: '_id job_uid prefix job_title work_order_number job_priority scheduled_end_time scheduled_start_time job_status current_job_status',
// 					populate: [
// 						{ path: 'job_category', select: '_id category_name category_uid estimated_duration category_color' },
// 					]
// 				},
// 				{ path: 'estimate', select: '_id prefix estimate_uid reference_no estimate_no estimate_date expiry_date estimate_status created_by total' },
// 				{ path: 'payment_term', select: '_id payment_term_uid payment_term_name no_of_days' },
// 				{ path: 'payment_mode', select: '_id payment_mode_uid payment_mode_name payment_mode_type payment_mode_description' },
// 				{ path: 'customer', select: '_id customer_uid customer_first_name customer_last_name customer_company_name customer_email customer_contact_no customer_billing_address' },
// 				{ path: 'template', select: '_id template_uid template_name template_description template type' },
// 				{ path: 'organization', select: "_id organization_uid organization_name organization_description organization_email organization_address is_active is_deleted" }
// 			]
// 		});
// 	}

// 	if (data) {
// 		var activity_array = [];
// 		async.eachSeries(actions, function (_a, a_cb) {
// 			if (_a.action_type == 'UPDATE' && !is_job_module) {
// 				if (_a.type_of_operation.value == 'UPDATE_FIELDS') {
// 					if (_a.field_type == 'DEFAULT') {
// 						var field = _a.field_value
// 						let fieldChanged = true
						
// 						if (field == 'invoice_status') {
// 							if( data['invoice_status'] != "DRAFT" && !data['customer'] && !data['organization'] ){
// 								fieldChanged = false
// 								logger.info("customer/oganization details missing")
// 							}else if(data['invoice_status']!= "DRAFT" && _a.change_value === "PAID" && (data['customer'] || data['organization'])){
// 								fieldChanged = true
// 								data[field] = _a.change_value
//                                 data["amount_paid"] = data['total']
//                                 data["amount_due"] = 0
//                                 data["is_paid"] = true
// 								data['status_history'].push({
// 									status_name: _a.change_value,
// 									customer_signature: "",
// 									remarks: "changed via workflow " + workflow_name,
// 									done_by: created_by,
// 									done_by_type: "EMPLOYEE"
// 								})

// 								// if(data['customer']){
// 								// 	let customerData = await Customers.findOne({company_id:company_id, _id:data['customer']["_id"], is_deleted:false})
// 								// 	if(customerData){ 	} }

// 							}else if( _a.change_value !== "PAID"){
// 								fieldChanged = true
// 								data[field] = _a.change_value
// 								data['status_history'].push({
// 									status_name: _a.change_value,
// 									customer_signature: "",
// 									remarks: "changed via workflow " + workflow_name,
// 									done_by: created_by,
// 									done_by_type: "EMPLOYEE"
// 								})
// 							}		
// 						}else{
// 							fieldChanged = true
// 							data[field] = _a.change_value
// 						}

// 						if(fieldChanged){
// 							activity_array.push({
// 								company_id: company_id,
// 								user_id: created_by,
// 								activity_module: "INVOICE",
// 								activity_action: "INVOICE",
// 								activity_type: "UPDATE",
// 								activity_action_uid: data.invoice_uid,
// 								activity_message: "updated " + _a.display_name + " to " + _a.change_value + " via workflow " + workflow_name
// 							});
// 						}
// 						a_cb();
// 					} else if (_a.field_type = 'CUSTOM') {
// 						var is_field_available = false;
// 						var g_name;
// 						if (_a.custom_values && _a.custom_values.length > 0) {
// 							_.each(_a.custom_values, function (c) {
// 								if (c.label == 'group_name') {
// 									g_name = c.value
// 								}
// 							})
// 						}
// 						async.eachSeries(data.custom_fields, function (d_cf, d_cb) {
// 							if (d_cf.label == _a.field_value) {
// 								if (g_name) {
// 									if (d_cf.group_name == g_name) {
// 										is_field_available = true;
// 										d_cf.value = _a.change_value
// 										activity_array.push({
// 											company_id: company_id,
// 											user_id: created_by,
// 											activity_module: "INVOICE",
// 											activity_action: "INVOICE",
// 											activity_type: "UPDATE",
// 											activity_action_uid: data.invoice_uid,
// 											activity_message: "updated " + _a.display_name + " to " + _a.change_value + " via workflow " + workflow_name
// 										});
// 									}
// 								} else {
// 									is_field_available = true;
// 									d_cf.value = _a.change_value
// 									activity_array.push({
// 										company_id: company_id,
// 										user_id: created_by,
// 										activity_module: "INVOICE",
// 										activity_action: "INVOICE",
// 										activity_type: "UPDATE",
// 										activity_action_uid: data.invoice_uid,
// 										activity_message: "updated " + _a.display_name + " to " + _a.change_value + " via workflow " + workflow_name
// 									});
// 								}
// 							}
// 							d_cb()
// 						}, async function (err, done) {
// 							if (!is_field_available) {
// 								data.custom_fields.push({ label: _a.field_value, value: _a.change_value })
// 								activity_array.push({
// 									company_id: company_id,
// 									user_id: created_by,
// 									activity_module: "INVOICE",
// 									activity_action: "INVOICE",
// 									activity_type: "UPDATE",
// 									activity_action_uid: data.invoice_uid,
// 									activity_message: "updated " + _a.display_name + " to " + _a.change_value + " via workflow " + workflow_name
// 								});
// 								a_cb()
// 							} else { a_cb() }
// 						});
// 					}
// 				} else if (_a.type_of_operation.value == 'EXECUTE_CUSTOM_FUNCTION') {
// 					if (_a.field_value == 'function_uid') {
// 						let function_uid = _a.change_value
// 						Custom_Function_Execution_History.create({
// 							company_id: company_id,
// 							user_id: created_by,
// 							custom_function_uid: function_uid,
// 							status: "IN_PROGRESS",
// 							started_at: Date.now(),
// 							attempt_no: 1,
// 							triggered_by: "WORKFLOW",
// 							triggered_by_uid: workflow_uid,
// 							input_data: JSON.stringify(data),
// 						}).then(function (executionData) {

// 							let options = {
// 								executionData: executionData,
// 								function_uid: function_uid,
// 								function_module: module_name,
// 								user_id: created_by,
// 								workflow_name: workflow_name,
// 								company_id: company_id,
// 								input_data: data
// 							}
// 							custom_function_actions.doCustomFunctionAction(options, a_cb);
// 						}).catch(function (error) {
// 							logger.error('Error in creating Customer Function Execution History: ', error.message);
// 						});
// 					}
// 				} else if (_a.type_of_operation.value == 'OTHERS') {
// 					(async function () {
// 						var mail_data = JSON.parse(JSON.stringify(data))
// 						mail_data['timezone'] = company_details.company_timezone;
// 						mail_data['company'] = company_details;
// 						var user_ids = [mail_data.created_by]

// 						let users = await User.findOne({
// 							where: {
// 								user_id: user_ids,
// 								company_id: company_id
// 							},
// 							attributes: ['user_id', 'user_uid', 'emp_code', 'first_name', 'last_name', 'email', 'designation', 'home_phone_number', 'work_phone_number', 'profile_picture', 'is_active', 'is_deleted'],
// 							include: [
// 								{ model: Roles, as: 'role', attributes: ['role_key'], raw: true }
// 							]
// 						});

// 						users = users.map(function (u) {
// 							return u.toJSON();
// 						});

// 						mail_data['created_by'] = users || {};
// 						if (_a.field_value == 'template_uid') {
// 							var pdf_file, email_subject, email_body, email_uid, renderEngine, em_body, e_sub;
// 							_.each(_a.custom_values, function (cv) {
// 								if (cv.label == 'email_subject') {
// 									email_subject = cv.value
// 								} else if (cv.label == 'email_body') {
// 									email_body = cv.value
// 								} else if (cv.label == 'email_config_uid') {
// 									email_uid = cv.value
// 								}
// 							})
// 							if (email_subject && email_body) {
// 								Invoice_Estimate_Template.findOne({ company_id: company_id, _id: mail_data.template }, async function (err, templateDetails) {
// 									if (templateDetails && templateDetails.template && templateDetails.template.length > 0) {
// 										// var e_card = handlebars.compile(templateDetails.template);
// 										// var e_card_html = templateDetails.template, e_sub = email_subject, em_body = email_body;
// 										// try {
// 										// 	e_card_html = e_card(mail_data);
// 										// } catch (error) {
// 										// 	var encodedError = error.message.replace(/[\u00A0-\u9999<>\&]/gim, function (i) {
// 										// 		return '&#' + i.charCodeAt(0) + ';';
// 										// 	});
// 										// 	logger.error('Invoice Workflow template err ' + '<pre>' + encodedError + '</pre>');
// 										// }

// 										var e_body = handlebars.compile(email_body || "");
// 										var sub = handlebars.compile(email_subject || "")
// 										try {
// 											em_body = e_body(mail_data);
// 											e_sub = sub(mail_data);
// 										} catch (error) {
// 											var encodedError = error.message.replace(/[\u00A0-\u9999<>\&]/gim, function (i) {
// 												return '&#' + i.charCodeAt(0) + ';';
// 											});
// 											logger.error('Invoice internal email template err ' + '<pre>' + encodedError + '</pre>');
// 										}

// 										renderEngine = templateDetails.render_engine || 'PHANTOM';
// 										let create_pdf;
// 										switch (renderEngine) {
// 											case 'PUPPETEER':
// 												create_pdf = await PdfGenerator.generatePdfUsingPuppeteer(mail_data, templateDetails, mail_data.invoice_uid)
// 												if (!create_pdf.status) {
// 													logger.error(create_pdf.type, create_pdf.title, create_pdf.message);
// 												}
// 												break;
// 											default:
// 												create_pdf = await PdfGenerator.generatePdf(mail_data, templateDetails, mail_data.invoice_uid)
// 												if (!create_pdf.status) {
// 													logger.error(create_pdf.type, create_pdf.title, create_pdf.message);
// 												}
// 												break;
// 										}

// 										if (create_pdf) {
// 											pdf_file = create_pdf.data;
// 										}
// 										// var options = { "phantomPath": config.PHANTOM_PATH, "format": "A4", "orientation": "portrait", "width": '280mm', "height": '396mm' };
// 										// pdf_file = pdf.create(e_card_html, options)
// 										// pdf_file.toFile("./tmp/" + mail_data.invoice_uid + ".pdf", function (err, res_pdf) {
// 										//if (err) { return logger.error('INVOICE CARD TO FILE CONVERT ERROR ', err); }
// 										let email = '';
// 										if (mail_data.customer_service_address && mail_data.customer_service_address.email) {
// 											email = mail_data.customer_service_address.email;
// 										} else if (mail_data.customer && mail_data.customer.customer_email) {
// 											email = mail_data.customer.customer_email;
// 										} else if (mail_data.organization && mail_data.organization.organization_email) {
// 											email = mail_data.organization.organization_email;
// 										}
// 										// let email = mail_data.customer.customer_email;
// 										// if (mail_data.customer_service_address && mail_data.customer_service_address.email && mail_data.customer_service_address.email.length > 0) {
// 										// 	email = mail_data.customer_service_address.email;
// 										// }
// 										if (email) {
// 											var mail_datum = {
// 												company_id: company_id,
// 												invoice_uid: mail_data.invoice_uid,
// 												email: email,
// 												invoice_no: mail_data.invoice_no,
// 												subject: e_sub,
// 												email_body: em_body,
// 												//pdf_path: path.join(__dirname, "../tmp/" + mail_data.invoice_uid + ".pdf")
// 											};
// 											let fileStat;

// 											if (renderEngine === 'PHANTOM') {
// 												await PdfGenerator.savePdfPhantom(pdf_file, path.join(__dirname, "../tmp/" + mail_data.invoice_uid + ".pdf"))
// 											}
// 											fileStat = await fs.promises.stat(path.join(__dirname, "../tmp/" + mail_data.invoice_uid + ".pdf"))
// 											mail_datum['pdf_path'] = path.join(__dirname, "../tmp/" + mail_data.invoice_uid + ".pdf")
// 											if (email_uid) {
// 												mail_datum['email_uid'] = email_uid
// 											}
// 											Mailer.sendInvoice_workflow(mail_datum);
// 											Util.createOutboundLog({
// 												company_id: company_id,
// 												done_by: created_by,
// 												module: "INVOICE",
// 												module_uid: data.invoice_uid,
// 												via: "WORKFLOW",
// 												type: "EMAIL",
// 												user_type: "CUSTOMER",
// 												message_subject: e_sub,
// 												sent_at: new Date(),
// 												user_uid: mail_data.customer.customer_uid
// 											})
// 											activity_array.push({
// 												company_id: company_id,
// 												user_id: created_by,
// 												activity_module: "INVOICE",
// 												activity_action: "INVOICE",
// 												activity_type: "UPDATE",
// 												activity_action_uid: data.invoice_uid,
// 												activity_message: "sent Invoice Card email to " + email + " for invoice " + data.invoice_no + " via workflow " + workflow_name
// 											});
// 											a_cb()
// 										} else {
// 											a_cb()
// 										}
// 										//});
// 									} else {
// 										a_cb()
// 									}
// 								})
// 							} else {
// 								a_cb()
// 							}
// 						} else if (_a.field_value == 'customer_sms') {
// 							var sms_body;
// 							async.eachSeries(_a.custom_values, function (cv, cv_cb) {
// 								if (cv.label == 'sms_body') {
// 									sms_body = cv.value
// 									cv_cb()
// 								} else {
// 									cv_cb()
// 								}
// 							}, async function (err, done) {
// 								var customer_no = mail_data.customer.customer_contact_no ? (mail_data.customer.customer_contact_no.mobile || mail_data.customer.customer_contact_no.work || mail_data.customer.customer_contact_no.home) : "";
// 								if (mail_data.customer_service_address && mail_data.customer_service_address.phone_number && mail_data.customer_service_address.phone_number.length > 0) {
// 									customer_no = mail_data.customer_service_address.phone_number;
// 								}
// 								if (sms_body && customer_no && customer_no.length > 1 && mail_data.customer.customer_notifications &&
// 									mail_data.customer.customer_notifications.sms) {

// 									var e_card = handlebars.compile(sms_body);
// 									var e_card_html = sms_body;
// 									try {
// 										e_card_html = e_card(mail_data);
// 									} catch (error) {
// 										var encodedError = error.message.replace(/[\u00A0-\u9999<>\&]/gim, function (i) {
// 											return '&#' + i.charCodeAt(0) + ';';
// 										});
// 										logger.error('Invoice Workflow template err ' + '<pre>' + encodedError + '</pre>');
// 									}
// 									Notification.emit('notification.send_sms', company_id,
// 										{
// 											message_body: e_card_html,
// 											send_to: customer_no,
// 											from_workflow: true,
// 											workflow_uid: workflow_uid
// 										}, user_uid);
// 									Util.createOutboundLog({
// 										company_id: company_id,
// 										done_by: created_by,
// 										module: "INVOICE",
// 										module_uid: data.invoice_uid,
// 										via: "WORKFLOW",
// 										type: "SMS",
// 										user_type: "CUSTOMER",
// 										message_subject: (sms_body && sms_body.length < 1000) ? sms_body : "",
// 										sent_at: new Date(),
// 										user_uid: mail_data.customer.customer_uid
// 									})
// 									activity_array.push({
// 										company_id: company_id,
// 										user_id: created_by,
// 										activity_module: "INVOICE",
// 										activity_action: "INVOICE",
// 										activity_type: "UPDATE",
// 										activity_action_uid: data.invoice_uid,
// 										activity_message: "sent SMS to Customer No." + customer_no + " for invoice " + data.invoice_no + " via workflow " + workflow_name
// 									});
// 									a_cb()
// 								} else {
// 									a_cb()
// 								}
// 							});
// 						} else if (_a.field_value == 'internal_email') {
// 							var to, cc, bcc, email_subject, email_body, email_uid, mail_type, team_uids, template = false;
// 							var pdf_file, renderEngine;
// 							async.each(_a.custom_values, function (cv, cb) {
// 								if (cv.label == 'email_subject') {
// 									email_subject = cv.value
// 									cb()
// 								} else if (cv.label == 'email_body') {
// 									email_body = cv.value
// 									cb()
// 								} else if (cv.label == 'to') {
// 									if (cv.value.length > 0) {
// 										to = cv.value.split(',')
// 									}
// 									cb()
// 								} else if (cv.label == 'cc') {
// 									if (cv.value.length > 0) {
// 										cc = cv.value.split(',')
// 									}
// 									cb()
// 								} else if (cv.label == 'bcc') {
// 									if (cv.value.length > 0) {
// 										bcc = cv.value.split(',')
// 									}
// 									cb()
// 								} else if (cv.label == 'email_config_uid') {
// 									email_uid = cv.value
// 									cb()
// 								} else if (cv.label == 'type') {
// 									mail_type = cv.value
// 									cb()
// 								} else if (cv.label == 'teams') {
// 									if (cv.value.length > 0) {
// 										team_uids = cv.value.split(',')
// 									}
// 									cb()
// 								} else if (cv.label == 'send_template') {
// 									template = (cv.value && cv.value == 'true') ? true : false;
// 									cb()
// 								} else {
// 									cb()
// 								}
// 							}, async function (done) {
// 								if (mail_type == 'SELECTED_TEAMS') {
// 									var users = await Teams.findAll({
// 										where: { team_uid: team_uids },
// 										attributes: ['team_id'],
// 										raw: true,
// 										include: [
// 											{
// 												model: User,
// 												where: { is_deleted: false },
// 												required: false,
// 												raw: true,
// 												as: 'users',
// 												through: { attributes: [] },
// 												attributes: ['user_id', 'email', 'home_phone_number', 'work_phone_number'],
// 												include: [
// 													{ model: Roles, as: 'role', attributes: ['role_key'], raw: true }
// 												]
// 											}
// 										]
// 									})
// 									to = _.pluck(users, 'users.email')

// 								} else if (mail_type == 'CREATED_USER') {
// 									// var users = await User.findOne({
// 									// 	where: {
// 									// 		user_id: data.created_by,
// 									// 		company_id: company_id
// 									// 	},
// 									// 	attributes: ['user_id', 'user_uid', 'emp_code', 'first_name', 'last_name', 'email', 'designation', 'home_phone_number', 'work_phone_number', 'profile_picture', 'is_active', 'is_deleted']
// 									// })
// 									if (mail_data['created_by'] && mail_data['created_by']['email']) {
// 										to = mail_data['created_by']['email']
// 									}
// 								}
// 								if (email_subject && email_body && to) {
// 									var e_body = handlebars.compile(email_body || "");
// 									var sub = handlebars.compile(email_subject || "");
// 									var e_sub = email_subject, em_body = email_body;
// 									try {
// 										em_body = e_body(mail_data);
// 										e_sub = sub(mail_data);
// 									} catch (error) {
// 										var encodedError = error.message.replace(/[\u00A0-\u9999<>\&]/gim, function (i) {
// 											return '&#' + i.charCodeAt(0) + ';';
// 										});
// 										logger.error('Invoice internal email template err ' + '<pre>' + encodedError + '</pre>');
// 									}
// 									var mail_datum = {
// 										company_id: company_id,
// 										invoice_uid: mail_data.invoice_uid,
// 										email: to,
// 										email_cc: cc,
// 										email_bcc: bcc,
// 										invoice_no: mail_data.invoice_no,
// 										email_subject: e_sub,
// 										email_body: em_body
// 									};
// 									if (email_uid) {
// 										mail_datum['email_uid'] = email_uid
// 									}
// 									mail_datum['module_name'] = 'INVOICE'
// 									if (template) {
// 										Invoice_Estimate_Template.findOne({ company_id: company_id, _id: mail_data.template, type: 'INVOICE' }, async function (err, templateDetails) {
// 											if (templateDetails) {

// 												// var e_card = handlebars.compile(templateDetails.template);
// 												// var e_card_html = templateDetails.template;
// 												// try {
// 												// 	e_card_html = e_card(mail_data);
// 												// } catch (error) {
// 												// 	var encodedError = error.message.replace(/[\u00A0-\u9999<>\&]/gim, function (i) {
// 												// 		return '&#' + i.charCodeAt(0) + ';';
// 												// 	});
// 												// 	logger.error('Invoice Workflow template err ' + '<pre>' + encodedError + '</pre>');
// 												// }

// 												renderEngine = templateDetails.render_engine || 'PHANTOM';
// 												let create_pdf;
// 												switch (renderEngine) {
// 													case 'PUPPETEER':
// 														create_pdf = await PdfGenerator.generatePdfUsingPuppeteer(mail_data, templateDetails, mail_data.invoice_uid)
// 														if (!create_pdf.status) {
// 															logger.error(create_pdf.type, create_pdf.title, create_pdf.message);
// 														}
// 														break;
// 													default:
// 														create_pdf = await PdfGenerator.generatePdf(mail_data, templateDetails, mail_data.invoice_uid)
// 														if (!create_pdf.status) {
// 															logger.error(create_pdf.type, create_pdf.title, create_pdf.message);
// 														}
// 														break;
// 												}

// 												if (create_pdf) {
// 													pdf_file = create_pdf.data;
// 												}
// 												let fileStat;

// 												if (renderEngine === 'PHANTOM') {
// 													await PdfGenerator.savePdfPhantom(pdf_file, path.join(__dirname, "../tmp/" + mail_data.invoice_uid + ".pdf"))
// 												}
// 												fileStat = await fs.promises.stat(path.join(__dirname, "../tmp/" + mail_data.invoice_uid + ".pdf"))
// 												mail_datum['pdf_path'] = path.join(__dirname, "../tmp/" + mail_data.invoice_uid + ".pdf")

// 												Mailer.sendInternalMail(mail_datum);
// 												// var options = { "phantomPath": config.PHANTOM_PATH, "format": "A4", "orientation": "portrait", "width": '280mm', "height": '396mm' };
// 												// pdf_file = pdf.create(e_card_html, options)
// 												// pdf_file.toFile("./tmp/" + j_data.invoice_uid + ".pdf", function (err, res_pdf) {
// 												// 	if (err) return logger.error('INVOICE CARD TO FILE CONVERT ERROR ', err);
// 												// 	if (pdf_file) {
// 												// 		pdf_file.toFile("./tmp/" + j_data.invoice_uid + ".pdf", function (err, res_pdf) {
// 												// 			if (err) return logger.error('INVOICE CARD TO FILE CONVERT ERROR ', err);
// 												// 			mail_datum['pdf_path'] = path.join(__dirname, "../tmp/" + j_data.invoice_uid + ".pdf")
// 												// 			Mailer.sendInternalMail(mail_datum);
// 												// 		});
// 												// 	}
// 												// });
// 											}
// 										})
// 									} else {
// 										Mailer.sendInternalMail(mail_datum);
// 									}
// 									if (cc) {
// 										to = to.concat(cc)
// 									}
// 									if (bcc) {
// 										to = to.concat(bcc)
// 									}
// 									var _to = (to) ? to.join(',') : ""
// 									Util.createOutboundLog({
// 										company_id: company_id,
// 										done_by: created_by,
// 										module: "INVOICE",
// 										module_uid: data.invoice_uid,
// 										via: "WORKFLOW",
// 										type: "EMAIL",
// 										user_type: "USER",
// 										message_subject: e_sub,
// 										sent_at: new Date(),
// 										user_uid: _to //expected is uid storing email 
// 									})
// 									activity_array.push({
// 										company_id: company_id,
// 										user_id: created_by,
// 										activity_module: "INVOICE",
// 										activity_action: "INVOICE",
// 										activity_type: "UPDATE",
// 										activity_action_uid: data.invoice_uid,
// 										activity_message: "sent Invoice Internal email to " + _to + " for invoice " + data.invoice_no + " via workflow " + workflow_name
// 									});
// 									a_cb()
// 								} else {
// 									a_cb()
// 								}
// 							})
// 						} else {
// 							a_cb()
// 						}
// 					} else if (_a.field_value == 'customer_sms') {
// 						var mail_data = JSON.parse(JSON.stringify(data))
// 						mail_data['timezone'] = company_details.company_timezone
// 						mail_data['company'] = company_details
// 						var sms_body;
// 						async.eachSeries(_a.custom_values, function (cv, cv_cb) {
// 							if (cv.label == 'sms_body') {
// 								sms_body = cv.value
// 								cv_cb()
// 							} else {
// 								cv_cb()
// 							}
// 						}, async function (err, done) {
// 							var customer_no 
// 							if(mail_data.customer){
// 								customer_no = mail_data.customer.customer_contact_no ? (mail_data.customer.customer_contact_no.mobile || mail_data.customer.customer_contact_no.work || mail_data.customer.customer_contact_no.home) : "";
// 							}
// 							if (mail_data.customer_service_address && mail_data.customer_service_address.phone_number && mail_data.customer_service_address.phone_number.length > 0) {
// 								customer_no = mail_data.customer_service_address.phone_number;
// 							}
// 							if (sms_body && customer_no && customer_no.length > 1 && mail_data.customer && mail_data.customer.customer_notifications &&
// 								mail_data.customer.customer_notifications.sms) {

// 								var user_ids = [mail_data.created_by]

// 								let users = await User.findAll({
// 									where: {
// 										user_id: user_ids,
// 										company_id: company_id
// 									},
// 									attributes: ['user_id', 'user_uid', 'emp_code', 'first_name', 'last_name', 'email', 'designation', 'home_phone_number', 'work_phone_number', 'profile_picture', 'is_active', 'is_deleted'],
// 									include: [
// 										{ model: Roles, as: 'role', attributes: ['role_key'], raw: true }
// 									]
// 								});

// 								users = users.map(function (u) {
// 									return u.toJSON();
// 								});

// 								mail_data['created_by'] = _.chain(users).findWhere({ user_id: mail_data.created_by }).omit('user_id').value();

// 								var e_card = handlebars.compile(sms_body);
// 								var e_card_html = sms_body;
// 								try {
// 									e_card_html = e_card(mail_data);
// 								} catch (error) {
// 									var encodedError = error.message.replace(/[\u00A0-\u9999<>\&]/gim, function (i) {
// 										return '&#' + i.charCodeAt(0) + ';';
// 									});
// 									logger.error('Invoice Workflow template err ' + '<pre>' + encodedError + '</pre>');
// 								}
// 								Notification.emit('notification.send_sms', company_id,
// 									{
// 										message_body: e_card_html,
// 										send_to: customer_no,
// 										from_workflow: true,
// 										workflow_uid: workflow_uid
// 									}, user_uid);
// 								Util.createOutboundLog({
// 									company_id: company_id,
// 									done_by: created_by,
// 									module: "INVOICE",
// 									module_uid: data.invoice_uid,
// 									via: "WORKFLOW",
// 									type: "SMS",
// 									user_type: "CUSTOMER",
// 									message_subject: (sms_body && sms_body.length < 1000) ? sms_body : "",
// 									sent_at: new Date(),
// 									user_uid: mail_data.customer.customer_uid
// 								})
// 								activity_array.push({
// 									company_id: company_id,
// 									user_id: created_by,
// 									activity_module: "INVOICE",
// 									activity_action: "INVOICE",
// 									activity_type: "UPDATE",
// 									activity_action_uid: data.invoice_uid,
// 									activity_message: "sent SMS to Customer No." + customer_no + " for invoice " + data.invoice_no + " via workflow " + workflow_name
// 								});
// 								a_cb()
// 							} else {
// 								a_cb()
// 							}
// 						});
// 					} else if (_a.field_value == 'internal_email') {
// 						var to = [], cc, bcc, email_subject, email_body, email_uid, mail_type, team_uids, template = false;
// 						var pdf_file;
// 						async.each(_a.custom_values, function (cv, cb) {
// 							if (cv.label == 'email_subject') {
// 								email_subject = cv.value
// 								cb()
// 							} else if (cv.label == 'email_body') {
// 								email_body = cv.value
// 								cb()
// 							} else if (cv.label == 'to') {
// 								if (cv.value.length > 0) {
// 									to =[...to, ...cv.value.split(',')] 
// 								}
// 								cb()
// 							} else if (cv.label == 'cc') {
// 								if (cv.value.length > 0) {
// 									cc = cv.value.split(',')
// 								}
// 								cb()
// 							} else if (cv.label == 'bcc') {
// 								if (cv.value.length > 0) {
// 									bcc = cv.value.split(',')
// 								}
// 								cb()
// 							} else if (cv.label == 'email_config_uid') {
// 								email_uid = cv.value
// 								cb()
// 							} else if (cv.label == 'type') {
// 								mail_type = cv.value
// 								cb()
// 							} else if (cv.label == 'teams') {
// 								if (cv.value.length > 0) {
// 									team_uids = cv.value.split(',')
// 								}
// 								cb()
// 							} else if (cv.label == 'send_template') {
// 								template = (cv.value && cv.value == 'true') ? true : false;
// 								cb()
// 							} else {
// 								cb()
// 							}
// 						}, async function (done) {
// 							if (mail_type == 'SELECTED_TEAMS') {
// 								var users = await Teams.findAll({
// 									where: { team_uid: team_uids },
// 									attributes: ['team_id'],
// 									raw: true,
// 									include: [
// 										{
// 											model: User,
// 											where: { is_deleted: false },
// 											required: false,
// 											raw: true,
// 											as: 'users',
// 											through: { attributes: [] },
// 											attributes: ['user_id', 'email', 'home_phone_number', 'work_phone_number'],
// 											include: [
// 												{ model: Roles, as: 'role', attributes: ['role_key'], raw: true }
// 											]
// 										}
// 									]
// 								})
// 								to = [...to, ..._.pluck(users, 'users.email')]

// 							} else if (mail_type == 'CREATED_USER') {
// 								var users = await User.findOne({
// 									where: {
// 										user_id: data.created_by,
// 										company_id: company_id
// 									},
// 									attributes: ['user_id', 'user_uid', 'emp_code', 'first_name', 'last_name', 'email', 'designation', 'home_phone_number', 'work_phone_number', 'profile_picture', 'is_active', 'is_deleted']
// 								})
// 								if (users) {
// 									to = [...to, ...[users.email]]
// 								}
// 							}
// 							if (email_subject && email_body && to) {
// 								to = _.uniq(to)
// 								//parse to help handlebar compile data
// 								var j_data = JSON.parse(JSON.stringify(data))
// 								j_data['timezone'] = company_details.company_timezone
// 								j_data['company'] = company_details
// 								var e_body = handlebars.compile(email_body || "");
// 								var sub = handlebars.compile(email_subject || "");
// 								var e_sub = email_subject, em_body = email_body;
// 								try {
// 									em_body = e_body(j_data);
// 									e_sub = sub(j_data);
// 								} catch (error) {
// 									var encodedError = error.message.replace(/[\u00A0-\u9999<>\&]/gim, function (i) {
// 										return '&#' + i.charCodeAt(0) + ';';
// 									});
// 									logger.error('Invoice internal email template err ' + '<pre>' + encodedError + '</pre>');
// 								}
// 								var mail_datum = {
// 									company_id: company_id,
// 									invoice_uid: j_data.invoice_uid,
// 									email: to,
// 									email_cc: cc,
// 									email_bcc: bcc,
// 									invoice_no: j_data.invoice_no,
// 									email_subject: e_sub,
// 									email_body: em_body,
// 									//pdf_path: path.join(__dirname, "../../tmp/" + mail_data.job_uid + ".pdf")
// 								};
// 								if (email_uid) {
// 									mail_datum['email_uid'] = email_uid
// 								}
// 								mail_datum['module_name'] = 'INVOICE'
// 								if (template) {
// 									Invoice_Estimate_Template.findOne({ company_id: company_id, _id: j_data.template, type: 'INVOICE' }, async function (err, templateDetails) {
// 										if (templateDetails) {
// 											var user_ids = [j_data.created_by]
// 											let users = await User.findAll({
// 												where: {
// 													user_id: user_ids,
// 													company_id: company_id
// 												},
// 												attributes: ['user_id', 'user_uid', 'emp_code', 'first_name', 'last_name', 'email', 'designation', 'home_phone_number', 'work_phone_number', 'profile_picture', 'is_active', 'is_deleted'],
// 												include: [
// 													{ model: Roles, as: 'role', attributes: ['role_key'], raw: true }
// 												]
// 											});

// 											users = users.map(function (u) {
// 												return u.toJSON();
// 											});

// 											j_data['created_by'] = _.chain(users).findWhere({ user_id: j_data.created_by }).omit('user_id').value();

// 											var e_card = handlebars.compile(templateDetails.template);
// 											var e_card_html = templateDetails.template;
// 											try {
// 												e_card_html = e_card(j_data);
// 											} catch (error) {
// 												var encodedError = error.message.replace(/[\u00A0-\u9999<>\&]/gim, function (i) {
// 													return '&#' + i.charCodeAt(0) + ';';
// 												});
// 												logger.error('Invoice Workflow template err ' + '<pre>' + encodedError + '</pre>');
// 											}
// 										]
// 									}).then(function (team_users) {
// 										user_ids = _.pluck(team_users, 'users.user_id');
// 										cv_cb();
// 									})
// 								} else {
// 									cv_cb();
// 								}
// <<<<<<< HEAD
// 								if (cc) {
// 									to = to.concat(cc)
// 								}
// 								if (bcc) {
// 									to = to.concat(bcc)
// 								}
// 								var _to = (to) ? to.join(',') : ""
// 								Util.createOutboundLog({
// 									company_id: company_id,
// 									done_by: created_by,
// 									module: "INVOICE",
// 									module_uid: data.invoice_uid,
// 									via: "WORKFLOW",
// 									type: "EMAIL",
// 									user_type: "USER",
// 									message_subject: e_sub,
// 									sent_at: new Date(),
// 									user_uid: _to //expected is uid storing email 
// 								})
// 								activity_array.push({
// 									company_id: company_id,
// 									user_id: created_by,
// 									activity_module: "INVOICE",
// 									activity_action: "INVOICE",
// 									activity_type: "UPDATE",
// 									activity_action_uid: data.invoice_uid,
// 									activity_message: "sent Invoice Internal email to " + _to + " for invoice " + data.invoice_no + " via workflow " + workflow_name
// 								});
// 								a_cb()
// 							} else {
// 								a_cb()
// 							}
// 						})
// 					} else if (_a.field_value == 'internal_sms') {
// 						var to, sms_body, send_sms = false;
// 						//parse to help handlebar compile data
// 						var j_data = JSON.parse(JSON.stringify(data))
// 						j_data['timezone'] = company_details.company_timezone
// 						j_data['company'] = company_details
// 						_.each(_a.custom_values, function (cv) {
// 							if (cv.label == 'to') {
// 								to = cv.value
// 							} else if (cv.label == 'sms_body') {
// 								sms_body = cv.value
// 							}
// 							if (to && sms_body) {
// 								send_sms = true
// 								var t = handlebars.compile(sms_body || "");
// 								var s_b = sms_body;
// =======
// 							}, function (done) {
// 								var e_body = handlebars.compile(push_msg || "");
// 								var e_b = push_msg
// >>>>>>> 553652430ed0130690d8626b927538b728353832
// 								try {
// 									e_b = e_body(mail_data);
// 								} catch (error) {
// 									var encodedError = error.message.replace(/[\u00A0-\u9999<>\&]/gim, function (i) {
// 										return '&#' + i.charCodeAt(0) + ';';
// 									});
// 									logger.error('Job internal push Workflow err ' + '<pre>' + encodedError + '</pre>');
// 								}
// <<<<<<< HEAD
// 								Notification.emit('notification.send_sms', company_id,
// 									{
// 										message_body: s_b,
// 										send_to: to,
// 										from_workflow: true,
// 										workflow_uid: workflow_uid
// 									}, user_uid);
// 								Util.createOutboundLog({
// 									company_id: company_id,
// 									done_by: created_by,
// 									module: "INVOICE",
// 									module_uid: data.invoice_uid,
// 									via: "WORKFLOW",
// 									type: "SMS",
// 									user_type: "USER",
// 									message_subject: s_b,
// 									sent_at: new Date(),
// 									user_uid: to //expected is uid storing ph.no 
// 								})
// 								a_cb()
// 							} 
// 						})
// 						if(!send_sms){
// 							a_cb()
// 						}
// 					} else if (_a.field_value == 'internal_push') {
// 						//parse to help handlebar compile data
// 						var j_data = JSON.parse(JSON.stringify(data))
// 						j_data['timezone'] = company_details['company_timezone']
// 						j_data['company'] = company_details
// 						let user_uids = [], team_uids = [], push_msg, mail_type, user_ids = [];
// 						async.eachSeries(_a.custom_values, function (cv, cv_cb) {
// 							if (cv.label == 'user_uid' && cv.value) {
// 								var _uids = cv.value.split(',')
// 								user_uids = user_uids.concat(_uids)
// 								cv_cb()
// 							} else if (cv.label == 'message') {
// 								push_msg = cv.value
// 								cv_cb()
// 							} else if (cv.label == 'type') {
// 								mail_type = cv.value
// 								if (mail_type == 'CREATED_USER') {
// 									user_ids = [j_data.created_by]
// 									cv_cb()
// 								} else {
// 									cv_cb()
// 								}
// 							} else if (cv.label == 'team_uid') {
// 								var t_uids = cv.value.split(',')
// 								team_uids = team_uids.concat(t_uids)
// 								Teams.findAll({
// 									where: { team_uid: team_uids },
// 									attributes: ['team_id'],
// 									raw: true,
// 									include: [
// 										{
// 											model: User,
// 											where: { is_deleted: false },
// 											required: false,
// 											raw: true,
// 											as: 'users',
// 											through: { attributes: [] },
// 											attributes: ['user_id']
// 										}
// 									]
// 								}).then(function (team_users) {
// 									user_ids = _.pluck(team_users, 'users.user_id');
// 									cv_cb();
// 								})
// 							} else {
// 								cv_cb();
// 							}
// 						}, function (done) {
// 							var e_body = handlebars.compile(push_msg || "");
// 							var e_b = push_msg
// 							try {
// 								e_b = e_body(j_data);
// 							} catch (error) {
// 								var encodedError = error.message.replace(/[\u00A0-\u9999<>\&]/gim, function (i) {
// 									return '&#' + i.charCodeAt(0) + ';';
// 								});
// 								logger.error('Job internal push Workflow err ' + '<pre>' + encodedError + '</pre>');
// 							}
// 							if (user_uids.length > 0 && push_msg.length > 0) {
// 								User.findAll({
// 									where: {
// 										user_uid: user_uids,
// 										company_id: company_id
// 									},
// 									attributes: ['user_id']
// 								}).then(function (users) {
// 									var user_ids = _.pluck(users, 'user_id')
// =======
// 								if (user_uids.length > 0 && push_msg.length > 0) {
// 									User.findAll({
// 										where: {
// 											user_uid: user_uids,
// 											company_id: company_id
// 										},
// 										attributes: ['user_id']
// 									}).then(function (users) {
// 										var user_ids = _.pluck(users, 'user_id')
// 										Push_Notification.sendNotification({
// 											user_ids: user_ids,
// 											company_id: company_id,
// 											data: {
// 												title: "Invoice Notification",
// 												body: e_b,
// 												type: "INVOICE",
// 												invoice_uid: data.invoice_uid,
// 												action_uid: data.invoice_uid,
// 												additional_data: {
// 													action_type: "INVOICE",
// 													redirect_to: data.invoice_uid,
// 													type: 'INTERNAL'
// 												}
// 											}
// 										});
// 										a_cb()
// 									}).catch(function (e) {
// 										logger.error('ERROR GETTING USERS FOR INTERNAL PUSH NOTIFICATION - JOB')
// 										a_cb()
// 									})
// 								} else if (user_ids.length > 0 && push_msg.length > 0) {
// >>>>>>> 553652430ed0130690d8626b927538b728353832
// 									Push_Notification.sendNotification({
// 										user_ids: user_ids,
// 										company_id: company_id,
// 										data: {
// 											title: "Invoice Notification",
// 											body: e_b,
// 											type: "INVOICE",
// 											invoice_uid: data.invoice_uid,
// 											action_uid: data.invoice_uid,
// 											additional_data: {
// 												action_type: "INVOICE",
// 												redirect_to: data.invoice_uid,
// 												type: 'INTERNAL'
// 											}
// 										}
// 									});
// 									a_cb()
// 								} else {
// 									a_cb()
// 								}
// 							})
// 						} else {
// 							a_cb()
// 						}
// 					})();

// 				} else {
// 					a_cb()
// 				}
// 			} else if (_a.action_type == 'CREATE') {
// 				if (_a.type_of_operation.value == 'CREATE_INVOICE') {
// 					var payment_term_details, template_details;
// 					async.eachSeries(_a.custom_values, function (cv, cv_cb) {
// 						if (cv.label == 'payment_term') {
// 							Invoice_Payment_Term.findOne({
// 								company_id: company_id,
// 								payment_term_uid: cv.value
// 							}).then(function (pt) {
// 								payment_term_details = pt
// 								cv_cb();
// 							})
// 						} else if (cv.label == 'template') {
// 							Invoice_Estimate_Template.findOne({
// 								company_id: company_id,
// 								template_uid: cv.value
// 							}).then(function (t) {
// 								template_details = t
// 								cv_cb()
// 							})
// 						}
// 					}, async function (err, done) {
// 						//GET COMPANY CONFIG FOR INVOICE PREFIX
// 						let company_config_details = await CompanyConfig.findOne({
// 							company_id: company_id
// 						}).lean();
// 						var prefix;
// 						if (company_config_details && company_config_details.invoice && company_config_details.invoice.prefix) {
// 							if (company_config_details.invoice.prefix.indexOf('{{') > -1) {
// 								prefix = Prefix_Formatter.prefixFormatter(company_config_details.invoice.prefix)
// 							} else {
// 								prefix = company_config_details.invoice.prefix
// 							}
// 						}
// 						let description = ` created through workflow ${workflow_name} - ${workflow_uid}`
// 						var new_invoice_detail = {
// 							invoice_uid: uuidv1(),
// 							prefix: prefix,
// 							company_id: company_id,
// 							created_by: created_by,
// 							invoice_date: moment(),
// 							due_date: moment().add(payment_term_details.no_of_days, 'days').toDate(),
// 							customer: data.customer ? data.customer._id : null,
// 							job: (data.job) ? data.job._id : null,
// 							estimate: data.estimate ? data.estimate._id : null,
// 							customer_billing_address: data.customer ? data.customer.customer_billing_address : data.organization.organization_address,
// 							line_items: data.line_items,
// 							discount: data.discount,
// 							sub_total: data.sub_total,
// 							total: data.total,
// 							template: template_details._id,
// 							payment_term: payment_term_details._id,
// 							invoice_status: "DRAFT",
// 							status_history: [
// 								{
// 									status_name: "DRAFT",
// 									done_by: created_by,
// 									done_by_type: "EMPLOYEE"
// 								}
// 							],
// 							tax: data.tax,
// 							description: data.description ? data.description + description: description,
// 							organization: data.organization ? data.organization._id : null,
// 							property: data.property ? data.property._id : null,
// 							project: data.project,
// 							customer_service_address: data.customer_service_address,
// 							total_discount: data.total_discount,
// 							remarks: data.remarks,
// 							attachments: data.attachments,
// 							notes: data.notes,
// 							custom_fields: data.custom_fields,
// 							public_url: data.public_url,
// 							payment_url: data.payment_url,
// 							financing: data.financing,
// 							tags: data.tags,
// 							amount_due:data.total
// 						}
// 						if (data.job) {
// 							new_invoice_detail['job'] = data.job._id
// 						}
// 						if(new_invoice_detail['organization'] || new_invoice_detail['customer']){
// 							Invoice(new_invoice_detail).save(async function (err, new_invoice) {
// 								if (err) {
// 									logger.error("ERROR IN CREATING INVOICE:" + err);
// 									a_cb()
// 								} else {
// 									logger.info("INVOICE CREATED SUCCESSFULLY:");
// 									data['is_converted'] = true
// 									//CREATE ACTIVITY
// 									activity_array.push({
// 										company_id: company_id,
// 										user_id: created_by,
// 										activity_module: "INVOICE",
// 										activity_action: "INVOICE",
// 										activity_type: "CREATE",
// 										activity_action_uid: new_invoice.invoice_uid,
// 										activity_message: "created new Invoice " + ((new_invoice.prefix || "") + new_invoice.invoice_no) + " via Workflow " + workflow_name
// 									});
	
// 									// if(new_invoice){
// 									// 	let jobDetails = await Jobs.findOne({ company_id: new_invoice.company_id, _id: new_invoice.job, is_deleted: false})
// 									// 	jobDetails['invoice'] = {
// 									// 		is_invoiced: true,
// 									// 		invoice_status: new_invoice['invoice_status'],
// 									// 		invoice: new_invoice['_id']
// 									// 	  }
// 									// 	  jobDetails.save()
// 									// }
	
// 									// EMIT EVENT
// 									Notification.emit('invoice.new', company_id, {
// 										invoice_uid: new_invoice.invoice_uid,
// 										company_uid: company_uid,
// 										from_workflow: true,
// 										workflow_uid: workflow_uid
// 									}, user_uid);
// 									invoiceReminder(company_id, new_invoice);
// 									a_cb()
// 								}
// 							});
// 						}else{
// 							logger.error("EITHER CUSTOMER OR ORGANIZATION DATA REQUIRED TO CREATE INVOICE IN WORKFLOW");
// 							a_cb()
// 						}
						
// 					});
// 				}
// 			}
// 		}, async function (err, done) {
// 			if (data && !is_job_module) {
// 				data.save();
// 			}
// 			//call activities insert
// 			Post_Actions.addUserActivities(activity_array)
// 		});
// 	}
// }

// <<<<<<< HEAD

// const invoiceReminder = function (company_id, invoice_saved) {
// 	Estimate_Invoice_Reminder.find({ company_id: company_id, type: 'INVOICE', is_deleted: false }, "-_id reminder_uid reminder_name reminder_type remind_before remind_to type sms_body email_subject additional_email_recipients email_body email_attachment_template is_deleted created_at created_by", function (err, inv_reminders) {
// =======
// const deleteEstimateInvoiceReminders = async function (company_id, module_name, module_data) {
// 	let filter = { "data.company_id": company_id, "data.estimate_id": module_data._id, name: "estimate_reminder", lastRunAt: { '$exists': false } };
// 	if (module_name == 'INVOICE') {
// 		filter = { "data.company_id": company_id, "data.invoice_id": module_data._id, name: "invoice_reminder", lastRunAt: { '$exists': false } }
// 	}
// 	logger.info('CANCELLING PREV JOBS SCHEDULED TO SET ESTIMATE / INVOICE REMINDER')
// 	var numRemoved = await Scheduler.cancel(filter);
// 	logger.info('REMOVED THE SCHEDULED REMINDER JOBS ESTIMATE/ INVOICE : ' + numRemoved);
// }

// const scheduleEstimateInvoiceReminders = async function (company_id, module_name, module_data) {
// 	await deleteEstimateInvoiceReminders(company_id, module_name, module_data)
// 	Estimate_Invoice_Reminder.find({ company_id: company_id, type: module_name, is_deleted: false, is_active: true }, async function (err, reminders) {
// >>>>>>> 553652430ed0130690d8626b927538b728353832
// 		if (err) {
// 			logger.error("ERROR IN GETTING ESTIMATE/INVOICE REMINDERS ", err);
// 		}
// 		else {
// 			if (reminders && reminders.length > 0) {
// 				let company_details = await Util.getCompanyDetails(company_id);
// 				let companyConfig = await CompanyConfig.findOne({ company_id: company_id }).lean();
// 				//TIME IS IN COMPANY TIMEZONE
// 				let business_st = '09:00:00';
// 				if (companyConfig && companyConfig.business_hours && companyConfig.business_hours.start_time) {
// 					business_st = companyConfig.business_hours.start_time;
// 				}

// 				let date_key_name = 'ESTIMATE_DATE';
// 				let exp_key_name = 'expiry_date';
// 				let uid = 'estimate_uid', id = 'estimate_id';
// 				if (module_name == 'INVOICE') {
// 					date_key_name = 'INVOICE_DATE';
// 					exp_key_name = 'due_date';
// 					uid = 'invoice_uid', id = 'invoice_id';
// 				}
// 				_.each(reminders, function (r) {
// 					if (r.send_at) {
// 						business_st = r.send_at
// 					}
// 					//CONVERT TO UTC
// 					let send_time, ed, remind_at;
// 					if (r.date_type && r.date_type == date_key_name) {
// 						let key_name = date_key_name.toLowerCase();
// 						ed = moment(module_data[key_name]).format(Constants.DATE_FORMAT);
// 					} else {
// 						ed = moment(module_data[exp_key_name]).format(Constants.DATE_FORMAT);
// 					}
// 					ed = moment(ed + " " + business_st).format(Constants.DATE_TIME_FULL_FORMAT)
// 					send_time = moment.tz(ed, company_details.company_timezone).utc().format(Constants.DATE_TIME_FULL_FORMAT);
// 					remind_at = moment(send_time).add(r.remind_before, "days").toDate();

// 					let name = module_name.toLowerCase() + '_reminder';
// 					let reminder_data = {
// 						reminder_uid: r.reminder_uid,
// 						reminder_name: r.reminder_name,
// 						company_id: company_id,
// 						remind_before: r.remind_before,
// 						reminder_to: r.reminder_to,
// 						send_to_users: r.send_to_users,
// 						send_to_teams: r.send_to_teams,
// 						reminder_template: r.email_attachment_template,
// 						reminder_body: r.email_body,
// 						reminder_addtl_recipients: r.additional_email_recipients,
// 						reminder_subject: r.email_subject,
// 						reminder_sms_body: r.sms_body,
// 						reminder_type: r.reminder_type,
// 						send_at: r.send_at,
// 						created_by: r.created_by
// 					}
// 					reminder_data[uid] = module_data[uid];
// 					reminder_data[id] = module_data['_id'];

// 					//SKIP PAST REMINDERS
// 					if (moment(remind_at).isSameOrAfter(moment())) {
// 						Scheduler.schedule(remind_at, name, reminder_data);
// 					}
// 					//EMIT EVENT
// 					// Notification.emit('invoice.reminder', company_id,
// 					//   {
// 					//     invoice_uid: invoice_details.invoice_uid,
// 					//     company_uid: req.company.company_uid,
// 					//     reminder_uid: r.reminder_uid
// 					//   },
// 					// req.user.user_uid);

// 				});
// 			}
// 		}
// 	})
// }

// // const invoiceEstimateReminder = function (company_id, data_saved) {
// // 	Estimate_Invoice_Reminder.find({ company_id: company_id, type: 'INVOICE', is_deleted: false }, "-_id reminder_uid reminder_name reminder_type remind_before remind_to type sms_body email_subject additional_email_recipients email_body email_attachment_template is_deleted created_at created_by", function (err, inv_reminders) {
// // 		if (err) {
// // 			logger.error("ERROR IN GETTING INVOICE REMINDERS ", err);
// // 		}
// // 		else {
// // 			if (inv_reminders && inv_reminders.length > 0) {
// // 				// BEGIN INVOICE REMINDERS LOOP
// // 				_.each(inv_reminders, function (r) {
// // 					if (r.remind_before > 0) {
// // 						var remind_at = moment(invoice_saved.due_date).subtract(r.remind_before, "days").toDate();
// // 						Scheduler.schedule(remind_at, 'invoice_reminder', {
// // 							reminder_uid: r.reminder_uid,
// // 							reminder_name: r.reminder_name,
// // 							company_id: company_id,
// // 							invoice_id: invoice_saved._id,
// // 							invoice_uid: invoice_saved.invoice_uid,
// // 							remind_before: r.remind_before,
// // 							reminder_template: r.email_attachment_template,
// // 							reminder_body: r.email_body,
// // 							reminder_addtl_recipients: r.additional_email_recipients,
// // 							reminder_subject: r.email_subject,
// // 							reminder_sms_body: r.sms_body,
// // 							reminder_type: r.reminder_type,
// // 							created_by: r.created_by
// // 						});
// // 						//EMIT EVENT
// // 						// Notification.emit('invoice.reminder', company_id,
// // 						//   {
// // 						//     invoice_uid: invoice_details.invoice_uid,
// // 						//     company_uid: req.company.company_uid,
// // 						//     reminder_uid: r.reminder_uid,
// // 						//		workflow_uid:workflow_uid
// // 						//   },
// // 						// req.user.user_uid);
// // 					}
// // 				});
// // 			}
// // 		}
// // 	})
// // }

// const calculateLineItemDetails = async (data, company_id) => {
// 	try {
// 		let line_items = data.line_items || [];
// 		let tax = data.tax || [];
// 		let discount = data.discount;
// 		let add_approval = false;
// 		let override_total = data.override_total || false;

// 		let payload = {
// 			line_items: [],
// 			total: override_total ? data.total : 0,
// 			sub_total: override_total ? data.sub_total : 0,
// 			total_discount: 0,
// 			tax: tax
// 		}
// 		let total_array = [];
// 		let total_discount_array = [];
// 		let prd_uids = [], prd_location_uids = [], prd_grp_uids = [];
// 		let taxable_total = [];

// 		let companyConfig = await CompanyConfig.findOne({ company_id: company_id }).lean();
// 		let fixed_value = (companyConfig && companyConfig.general && companyConfig.general.decimal_roundoff) ? companyConfig.general.decimal_roundoff : 2;
// 		if (companyConfig && companyConfig.estimate && companyConfig.estimate.require_line_item_approval) {
// 			add_approval = true;
// 		}
// 		for (let line_item of line_items) {
// 			if (line_item.product_uid) {
// 				prd_uids.push(line_item.product_uid)
// 				if (line_item.group_uid) {
// 					prd_grp_uids.push(line_item.group_uid)
// 				}
// 				if (line_item.location_uid) {
// 					prd_location_uids.push(line_item.location_uid)
// 				}
// 			}
// 		}
// 		let product_db, product_loc_db, product_grp_db;
// 		if (prd_uids.length > 0) {
// 			product_db = await Product.find({ product_uid: { '$in': prd_uids }, company_id: company_id, is_deleted: false }, "_id prefix product_uid product_no product_name product_type product_manual_link brand specification uom product_files product_id product_barcode product_image quantity currency price meta_data product_description location_availability has_custom_tax tax is_deleted is_available created_by created_at").lean();
// 		}
// 		if (prd_grp_uids.length > 0) {
// 			product_grp_db = await ProductGroup.find({ product_group_uid: { '$in': prd_grp_uids }, company_id: company_id, is_deleted: false }, "_id product_group_name product_group_uid").lean();
// 		}
// 		if (prd_location_uids.length > 0) {
// 			product_loc_db = await ProductLocation.find({ location_uid: { '$in': prd_location_uids }, company_id: company_id, is_deleted: false }, "_id location_uid location_name location_type location_description location_address is_deleted created_by created_at").lean();
// 		}


// 		for (let l of line_items) {
// 			l.line_item_uid = l.line_item_uid ? l.line_item_uid : uuidv1();
// 			let prd;
// 			if (add_approval && (!l['approval_status'] || l['approval_status'] != 'APPROVED')) {
// 				l.approval_status = "PENDING";
// 			}
// 			if (!l.discount) {
// 				l.discount = 0
// 			}
// 			if (l.product_uid) {
// 				prd = _.findWhere(product_db, { product_uid: l.product_uid })
// 				let prd_loc = _.findWhere(product_loc_db, { location_uid: l.location_uid })
// 				let prd_grp;
// 				if (l.group_uid) {
// 					prd_grp = _.findWhere(product_grp_db, { product_group_uid: l.group_uid })
// 				}
// 				if (prd) {
// 					l.product_ref_id = prd._id
// 					l.product_id = (l.product_id) ? l.product_id : prd.product_id
// 					l.image = prd.product_image
// 					l.name = (l.name) ? l.name : prd.product_name
// 					l.brand = (l.brand) ? l.brand : prd.brand
// 					l.specification = (l.specification) ? l.specification : prd.specification
// 					l.uom = (l.uom) ? l.uom : prd.uom
// 					if (prd_loc) {
// 						l.location = prd_loc._id
// 						l.location_name = prd_loc.location_name
// 					}
// 					if (prd_grp) {
// 						l.group = prd_grp._id;
// 					}
// 				}
// 			}
// 			//calculate total for each line item
// 			let result = await Util.calculateTotalPricing(l.quantity, l.unit_price, l.discount, l.discount_type)
// 			l.total = result[0];
// 			l.discount_amount = result[1];
// 			total_discount_array.push(result[1])
// 			// IF CUSTOM TAX IS APPLIED FOR PRODUCT, CALCULATE CUSTOM TOTAL WITH TAX 
// 			if (l['tax'] && l['tax']['tax_name'] && l['tax']['tax_rate'] >= 0) {
// 				l['tax']['tax_amount'] = ((l['total'] * l['tax']['tax_rate']) / 100).toFixed(fixed_value);
// 				l['total'] = l['total'] + parseFloat(l['tax']['tax_amount']);
// 			} else if (prd && prd.has_custom_tax && prd.tax && prd.tax.tax_name) {
// 				l.tax = {
// 					tax_name: prd.tax.tax_name,
// 					tax_rate: prd.tax.tax_rate,
// 					tax_amount: ((l.total * prd.tax.tax_rate) / 100).toFixed(fixed_value)
// 				}
// 				l.total = l.total + parseFloat(l.tax.tax_amount)
// 			} else {
// 				taxable_total.push(l.total)
// 			}
// 			total_array.push(l.total)
// 		}
// 		payload.line_items = line_items;

// 		if (!override_total) {
// 			payload.sub_total = _.reduce(total_array, function (a, b) { return a + b; }, 0);
// 			payload.sub_total = parseFloat(payload.sub_total).toFixed(fixed_value);
// 			payload.total = payload.sub_total;
// 		}

// 		payload.total_discount = _.reduce(total_discount_array, function (a, b) { return a + b; }, 0);
// 		payload.total_discount = parseFloat(payload.total_discount).toFixed(fixed_value)

// 		if (discount && Object.keys(discount).length > 0) {
// 			if (discount.type == 'PERCENTAGE') {
// 				discount.value = ((parseFloat(payload.sub_total) * discount.percent) / 100).toFixed(fixed_value)
// 			}
// 			payload.discount = discount
// 			payload.total = (await Util.calculateDiscountedTotal(company_id, payload.sub_total, discount.value)).toFixed(fixed_value)
// 			payload.total_discount = (parseFloat(payload.total_discount) + parseFloat(discount.value)).toFixed(fixed_value)
// 		} else {
// 			if (!payload.total && payload.sub_total) {
// 				payload.total = payload.sub_total
// 			}
// 		}

// 		if (tax && tax.length > 0) {
// 			let initial_total = _.reduce(taxable_total, function (a, b) { return a + b; }, 0);
// 			let final_tax_amount = 0;
// 			let tax_uid = _.uniq(_.pluck(tax, 'tax_uid'))
// 			let tax_details = await Invoice_Estimate_Tax.find({ tax_uid: { '$in': tax_uid }, company_id: company_id, is_active: true }, "_id tax_uid tax_rate tax_name").lean();
// 			//2023-03-29 -- MAKING CHANGES TO SUPPORT TAXES FROM INTEGRATIONS
// 			// if (tax_details.length != tax_uid.length) {
// 			//   return {
// 			//     error: {
// 			//       message: "No Tax found for the given UID",
// 			//       title: "Invalid Tax UID",
// 			//       type: Constants.ERROR_MSG
// 			//     }
// 			//   }
// 			// }
// 			let i = 1;
// 			for (let _t of tax) {
// 				if (_t.tax_uid) {
// 					let _t_details = _.findWhere(tax_details, { tax_uid: _t.tax_uid })
// 					if (_t_details) {
// 						_t.tax_name = _t_details.tax_name;
// 						_t.tax_percent = _t.tax_percent || _t_details.tax_rate;
// 						_t.tax_id = _t_details._id;
// 						_t.tax_amount = ((parseFloat(initial_total) * _t.tax_percent) / 100).toFixed(fixed_value)
// 						final_tax_amount = final_tax_amount + parseFloat(_t.tax_amount)
// 					}
// 				} else {
// 					_t.tax_name = _t.tax_name || "Unnamed Tax " + i;
// 					_t.tax_percent = _t.tax_percent || 0;
// 					_t.tax_id = null;
// 					_t.tax_amount = ((parseFloat(initial_total) * _t.tax_percent) / 100).toFixed(fixed_value);
// 					final_tax_amount = final_tax_amount + parseFloat(_t.tax_amount);
// 				}
// 				i++;
// 			}
// 			payload.tax = tax
// 			if (!override_total) {
// 				payload.total = (parseFloat(payload.total) + final_tax_amount).toFixed(fixed_value);
// 			}
// 		}
// 		return payload;
// 	} catch (error) {
// 		throw new Error(`Error on calculation due to ${error.message}`)
// 	}
// }

// module.exports = {
// 	doInvoiceAction: doInvoiceAction,
// 	scheduleEstimateInvoiceReminders: scheduleEstimateInvoiceReminders,
// 	calculateLineItemDetails: calculateLineItemDetails
// }