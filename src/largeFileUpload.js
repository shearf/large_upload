(function($) {

	$.fn.extend({
		largeFileUpload : function(options) {

			try {
				if (!Html5LargeFileUpload.supportHtml5()) {
					throw new Error('need html5 support');
				}
			}
			catch (e) {
				alert(e.message);
			}

			var debug = function(msg) {
				console.debug(msg);
			};


			var defaults = {
				id : 'large_file_upload',
				per_size : 64 * 1024,
				size_limit : 200,
				file_types : '*.*',
				file_desc : '所有文件',

				init_handle : function() {},
				browse_file_handle : function() {},
				browse_file_complete_handle : function() {},
				start_upload_handle : function() {},
				pause_upload_handle : function() {},
				continue_upload_handle : function() {},
				upload_process_handle : function() {},
				cancel_upload_handle : function() {},
				upload_complete_handle : function() {},
				upload_error_handle : function() {},

				browse_button_label : '选择文件',
				start_upload_button_label : '开始上传',
				cancel_upload_button_label : '取消上传',
				pause_upload_button_label : '暂停上传',
				continue_upload_button_label : '继续上传'
			};
			options = $.extend(defaults, options);
			options.url = Html5LargeFileUpload.completeURL(options.url);

			return this.each(function() {
				var curr_upload_status = -1;
				var begin, file_size = 0;
				var file_name, file_ext = '';

				var file, url;
				var _is_requesting = false;				//是否在进行网络请求中
				var xhr2 = new XMLHttpRequest();

				var callback_init = options.init_handle;
				var callback_browse_file = options.browse_file_handle;
				var callback_browse_file_complete = options.browse_file_complete_handle;
				var callback_upload_process = options.upload_process_handle;
				var callback_upload_complete = options.upload_complete_handle;
				var callback_upload_error = options.upload_error_handle;
				var callback_start_upload = options.start_upload_handle;
				var callback_continue_upload = options.continue_upload_handle;
				var callback_pause_upload = options.pause_upload_handle;
				var callback_cancel_upload = options.cancel_upload_handle;

				var $wrap = $('#' + this.id);
				var file_input_id = this.id + '_' + 'btn_browse';
				var btn_upload_id = this.id + '_' + 'btn_upload';
				var btn_cancel_id = this.id + '_' + 'btn_cancel';

				//加载模板
				var html_template = '<input type="file" name="file" value="" id="'+ file_input_id +'" />'
									+ '&nbsp;&nbsp;&nbsp;&nbsp;<button id="' + btn_upload_id + '">#btn_upload#</button>'
									+ '&nbsp;&nbsp;&nbsp;&nbsp;<button id="' + btn_cancel_id + '">#btn_cancel#</button>';

				html_template = html_template.replace('#btn_upload#', options.start_upload_button_label)
							.replace('#btn_cancel#', options.cancel_upload_button_label);

				$wrap.html(html_template);

				var $inputFile = $('#' + file_input_id);
				var $btnUpload = $('#' + btn_upload_id);
				var $btnCancel = $('#' + btn_cancel_id);

				$inputFile.on('change', function() {
					selectFile();
				});

				curr_upload_status = Html5LargeFileUpload.upload_status.INIT;
				updateButtons();

				callback_init();

				function updateButtons() {
					switch (curr_upload_status) {

						case Html5LargeFileUpload.upload_status.INIT :
							$inputFile.prop('disabled', false);
							$btnUpload.prop('disabled', true);
							$btnCancel.prop('disabled', true);

							$inputFile.val('');
							$btnUpload.text(options.start_upload_button_label);

						break;

						case Html5LargeFileUpload.upload_status.SELECT_FILE :
							//按钮状态保持不变
							break;
						case Html5LargeFileUpload.upload_status.SELECT_FILE_COMPLETE :

							$btnUpload.prop('disabled', false);

							break;
						case Html5LargeFileUpload.upload_status.START_UPLOAD :

							$inputFile.prop('disabled', true);
							$btnCancel.prop('disabled', false);

							$btnUpload.text(options.pause_upload_button_label);

							break;
						case Html5LargeFileUpload.upload_status.UPLOAD_PROCESS :

							break;
						case Html5LargeFileUpload.upload_status.PAUSE_UPLOAD :

							$btnUpload.text(options.continue_upload_button_label);

							break;
						case Html5LargeFileUpload.upload_status.CONTINUE_UPLOAD :

							$btnUpload.text(options.pause_upload_button_label);

							break;
						case Html5LargeFileUpload.upload_status.CANCEL_UPLOAD :

							$inputFile.prop('disabled', false);
							$inputFile.val('');

							$btnUpload.prop('disabled', true);
							$btnCancel.prop('disabled', true);

							$btnUpload.text(options.start_upload_button_label);

							break;
						case Html5LargeFileUpload.upload_status.UPLOAD_ERROR :

							$inputFile.prop('disabled', false);
							$btnUpload.prop('disabled', false);
							$btnCancel.prop('disabled', false);

							$btnUpload.text(options.start_upload_button_label);

							break;
						case Html5LargeFileUpload.upload_status.UPLOAD_COMPLETE :

							$inputFile.prop('disabled', false);
							$btnUpload.prop('disabled', true);
							$btnCancel.prop('disabled', true);

							$btnUpload.text(options.start_upload_button_label);
							break;
					}

				};

				var selectFile = function() {
					file = $inputFile.get(0).files[0];
					file_size = file.size;
					file_name = file.name;
					if (file_size > options.size_limit * 1024 * 1024) {
						$inputFile.val('');

						curr_upload_status = Html5LargeFileUpload.upload_status.INIT;

						updateButtons();

						file = null;

						callback_upload_error(Html5LargeFileUpload.error_code.SIZE_LIMIT,
								options.size_limit);

						return ;
					}

					file_ext = file_name.substring(file_name.lastIndexOf('.')).toLowerCase();

					if (options.file_types != '*.*' && options.file_types != '')
					{
						if (options.file_types.indexOf(file_ext) <= 0) 		//该文件不在接受的文件范围内
						{
							file = null;

							callback_upload_error(Html5LargeFileUpload.error_code.FILE_TYPES,
									options.file_types);

							return ;
						}
					}

					//change buttons status
					curr_upload_status = Html5LargeFileUpload.upload_status.SELECT_FILE;
					updateButtons();

					//绑定取消上传的操作
					$btnCancel.on('click', cancelUpload);

					//先查询服务器端，获得已经上传数据大小
					url = options.url + '?file_name=' + file.name + '&file_size=' + file.size;
					xhr2.open('GET', url);
					xhr2.send();
					_is_requesting = true;

				};

				/**
				 * 开始上传
				 * @return {[type]}
				 */
				var startUpload = function() {
					curr_upload_status = Html5LargeFileUpload.upload_status.START_UPLOAD;
					updateButtons();

					$btnUpload.off('click').on('click', pauseUpload);

					_uploadFileData();		//上传文件

					callback_start_upload();
				};

				/**
				 * 暂停上传
				 * @return {[type]}
				 */
				var pauseUpload = function() {
					curr_upload_status = Html5LargeFileUpload.upload_status.PAUSE_UPLOAD;
					updateButtons();

					$btnUpload.off('click').on('click', continueUpload);

					// callback_pause_upload(); 需要等待服务器响应
				};

				/**
				 * 继续上传
				 * @return {[type]}
				 */
				var continueUpload = function() {
					curr_upload_status = Html5LargeFileUpload.upload_status.CONTINUE_UPLOAD;
					updateButtons();
					$btnUpload.off('click').on('click', pauseUpload);

					_uploadFileData();

					callback_continue_upload();
				};

				/**
				 * 取消上传
				 * @return {[type]}
				 */
				var cancelUpload = function() {
					curr_upload_status = Html5LargeFileUpload.upload_status.CANCEL_UPLOAD;
					updateButtons();

					$inputFile.val('');

					$btnUpload.off('click').on('click', startUpload);
					$btnCancel.off('click');

					callback_cancel_upload();
				};

				/**
				 * 正在上传
				 * @param {[type]} send
				 * @return {[type]}
				 */
				var _uploadProcess = function(send) {

					callback_upload_process(file_size, send);

					if (curr_upload_status === Html5LargeFileUpload.upload_status.PAUSE_UPLOAD) {
						callback_pause_upload();
					}
				};

				/**
				 * 上传完成
				 * @param {[type]} path
				 * @return {[type]}
				 */
				var _uploadComplete = function(path) {

					curr_upload_status = Html5LargeFileUpload.upload_status.UPLOAD_COMPLETE;
					updateButtons();

					$btnUpload.off('click');
					$btnCancel.off('click');

					callback_upload_complete(path, file_name, file_size);
				};

				/**
				 * 上传出现错误
				 * @param {[type]} code
				 * @param {[type]} msg
				 * @return {[type]}
				 */
				var _uploadError = function(code, msg) {

					curr_upload_status = Html5LargeFileUpload.upload_status.UPLOAD_ERROR;
					updateButtons();

					callback_upload_error(code, msg);

					$btnUpload.off('click').on('click', startUpload);
					$btnCancel.off('click');
				};

				/**
				 * 分段上传数据
				 * @return {[type]}
				 */
				var _uploadFileData = function() {

					if (!_is_requesting) {
						xhr2.open('POST', url);
						// xhr2.setRequestHeader("Content-type", "application/octet-stream");
						var end = begin + options.per_size < file_size ? begin + options.per_size : file_size;
						var blob = Html5LargeFileUpload.fileSlice(file, begin, end, 'application/octet-stream');

						xhr2.send(blob);
						_is_requesting = true;
						/* 重新用文件载入到文件中实现传输的方式错误
						var fr = new FileReader();
						fr.readAsArrayBuffer(blob);
						fr.onload = function() {
							var data = fr.result;
							xhr2.send(fr.result);
							_is_requesting = true;
						};
						*/
					}
				};

				/**
				 * 完成文件的加载
				 * @return {[type]}
				 */
				var _loadFileComplete = function(file_name, file_size, send) {

					curr_upload_status = Html5LargeFileUpload.upload_status.SELECT_FILE_COMPLETE;
					updateButtons();

					$btnUpload.on('click', startUpload);

					callback_browse_file_complete(file_name, file_size, send);
				};

				/**
				 * 上传过程中
				 * @param {[type]} event
				 * @return {[type]}
				 */
				xhr2.onprocess = function(event) {
					//还在载入文件的过程中，还没有开始上传文件
					if (curr_upload_status === Html5LargeFileUpload.upload_status.SELECT_FILE) {
						/*
						 *  @todo 标示文件还在载入中，还不能上传
						 */
					}
				};

				/**
				 * 上传请求出错
				 * @param {[type]} event
				 * @return {[type]}
				 */
				xhr2.onerror = function(event) {
					_is_requesting = false;
					callback_upload_error(Html5LargeFileUpload.error_code.RESPONSE_ERROR, xhr2.status);
				};

				xhr2.onloadend = function(event) {
					_is_requesting = false;
					if (xhr2.status == Html5LargeFileUpload.error_code.RESPONSE_SUCCESS) {
						var data = $.parseJSON(xhr2.responseText);
						if (data.statusCode == Html5LargeFileUpload.error_code.RESPONSE_SUCCESS) {
							begin = parseInt(data.send, 10);

							if (curr_upload_status === Html5LargeFileUpload.upload_status.SELECT_FILE) {

								_loadFileComplete(file_name, file_size, begin);
							}
							else if (curr_upload_status === Html5LargeFileUpload.upload_status.START_UPLOAD ||
									curr_upload_status === Html5LargeFileUpload.upload_status.CONTINUE_UPLOAD) {

								_uploadProcess(begin);

								if (begin < file_size) {
									_uploadFileData();
								}
								else {
									_uploadComplete(data.tmp);
								}
							}
							else if (curr_upload_status === Html5LargeFileUpload.upload_status.PAUSE_UPLOAD ||
									curr_upload_status === Html5LargeFileUpload.upload_status.CANCEL_UPLOAD) {
								_uploadProcess(begin);

								if (begin == file_size) {		//已经上传完成
									_uploadComplete(data.tmp);
								}
							}
						}
					}
					else {
						_uploadError(xhr2.status);
					}
				};

			});
		}
	});

})(jQuery);

var Html5LargeFileUpload = {
	error_code : {
		SIZE_LIMIT : -10001,
		IO_ERROR : -10002,
		FILE_TYPES : -10003,
		RESPONSE_SUCCESS : 200,
		RESPONSE_ERROR : 300
	},
	upload_status : {
		INIT : 					0,
		SELECT_FILE : 			1,
		SELECT_FILE_COMPLETE : 	2,
		START_UPLOAD : 			3,
		UPLOAD_PROCESS : 		4,
		PAUSE_UPLOAD : 			5,
		CONTINUE_UPLOAD : 		6,
		CANCEL_UPLOAD : 		7,
		UPLOAD_COMPLETE : 		8,
		UPLOAD_ERROR : 			9
	},
	browser : {
		versions:function(){
		var u = navigator.userAgent;
//		var app = navigator.appVersion;
		return {
			trident: u.indexOf('Trident') > -1, //IE内核
			presto: u.indexOf('Presto') > -1, //opera内核
			webKit: u.indexOf('AppleWebKit') > -1, //苹果、谷歌内核
			gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1, //火狐内核
			mobile: !!u.match(/AppleWebKit.*Mobile.*/)||!!u.match(/AppleWebKit/), //是否为移动终端
			ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), //ios终端
			android: u.indexOf('Android') > -1 || u.indexOf('Linux') > -1, //android终端或者uc浏览器
			iPhone: u.indexOf('iPhone') > -1 || u.indexOf('Mac') > -1, //是否为iPhone或者QQHD浏览器
			iPad: u.indexOf('iPad') > -1, //是否iPad
			webApp: u.indexOf('Safari') == -1 //是否web应该程序，没有头部与底部
			};
		}()
	},

	supportFlash : function () {

		return (this.browser.versions.ios || this.browser.versions.android
			|| this.browser.versions.iPhone || this.browser.versions.iPad
			|| (this.browser.versions.mobile && ! this.browser.versions.webKit)) ? false : true;

	},

	//完善url地址
	completeURL : function(url) {
		try {
			var path = "";
			if (typeof(url) !== "string" || url.match(/^https?:\/\//i) || url.match(/^\//) || url === "") {
				return url;
			}

			var indexSlash = window.location.pathname.lastIndexOf("/");
			if (indexSlash <= 0) {
				path = "/";
			} else {
				path = window.location.pathname.substr(0, indexSlash) + "/";
			}
			return path + url;
		} catch (ex) {
			return url;
		}
	},

	//是否满足HTML5上传的条件
	supportHtml5 : function () {
		var file_api_support = false;
		if (window.File && window.FileReader && window.FileList && window.Blob) {
			file_api_support = true;
		}
		else {
			file_api_support = false;
		}

		var xhr_support = false;
		var xhr = new XMLHttpRequest();
		if (typeof xhr.withCredentials == undefined) {
			//This browser does not support xhr2 yet.
			xhr_support = false;
		}
		else {
			xhr_support = true;
		}

		return xhr_support && file_api_support;
	},

	fileSlice : function (file, start, end, contentType) {

		if (file.mozSlice) {
			return file.mozSlice(start, end, contentType);
		}
		else if (file.slice) {
			return file.slice(start, end, contentType);
		}
		else if (file.webkitSlice) {
			return file.webkitSlice(start, end, contentType);
		}
	}
};