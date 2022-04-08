// /* eslint-disable no-undef */
/* eslint-disable react/no-danger */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable camelcase */
import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Tab,
  Tabs,
  Grid,
  Card,
  CardContent,
  Typography,
} from '@material-ui/core';
import Sidebar from 'custom-components/sidebar';
import CustomModal from 'custom-components/customModal';
import EmailEditor from 'react-email-editor';
import InputField from '../../custom-components/form-fields/inputField';
import EditableOption from '../../custom-components/form-fields/editableOption';
import SvgMail from 'icons/svgEmail';
import { useStyles } from './style';
import projectSetting from 'settings';
import { emailRegex } from 'models/regex';
import BtnGroup from 'custom-components/form-fields/btnGroup';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { useSelector, shallowEqual, useDispatch } from 'react-redux';
import { eventDataSelector, userInfoSelector, commonSelector } from 'redux/custom-selector';
import {
  PUTAPI,
  API,
  GETAPIWITHCUSTOMDOMAIN,
  POSTAPI,
  GETAPI,
  POSTAPIWITHCUSTOMDOMAIN,
} from 'api-setup/api-helper';
import { GET_BRAND_EVENT_SETTING, GET_SPEAKER_LIST } from 'api-setup/api-endpoints';
import { useSource, usePrevious } from 'lib/custom-common-hooks';
import ProjectSetting from 'settings';
import { setNewMessage } from 'redux/actions/setting-actions';
import axios from 'axios';
import { useCommunityVersionNumber } from 'lib/hooks/use-community-version';
import { getEventLogo } from 'lib/common-function';

const instance = axios.create({
  baseURL: `https://emailbuilder.immo.demohubilo.com/`,
  headers: {
    'Content-Type': 'application/json',
  },
});

const sendMailPostCall = async ({ url, headers, body }) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const { data } = await instance.request({ url, data: body, headers, method: 'post' });
    return data;
  } catch (error) {
    throw error;
  }
};

const CUSTOM_URL = ProjectSetting.customBaseURL;

const unlayer_api_key = 'UBjrRypCakZ0NYCxyNtIbh5JiJJEDynjwFEmTTymW01p5mZvP6sdTwAJjGvh0pP2';

const a11yProps = (index) => ({
  id: `events-tab-${index}`,
  'aria-controls': `events-tabpanel-${index}`,
});

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`events-tabpanel-${index}`}
      aria-labelledby={`events-tab-${index}`}
      {...other}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
};
const initState = {
  logos: [],
};

const DesignEmail = ({ speakers, emails, compaignName }) => {
  const classes = useStyles();
  const history = useHistory();
  const source = useSource();
  const dispatch = useDispatch();

  const [openSidePanel, setOpenSidePanel] = useState(false);
  const [HtmlEmailContent, setHtmlEmailContent] = useState();
  const emailEditorRef = useRef(null);
  const [isMailSent, setMailSent] = useState(false);
  const [state, setState] = useState({ ...initState });

  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [designs, setDesigns] = useState([]);
  const reduxData = useSelector(commonSelector, shallowEqual);
  const eventData = useSelector(eventDataSelector, shallowEqual);
  const { EventData } = eventData;

  const getDesignImage = async (design, displayMode = 'email') => {
    try {
      const res = await fetch('https://api.unlayer.com/v2/export/image', {
        method: 'POST',
        headers: {
          // Authorization: `Basic ${btoa(`${projectSetting.unlayer_api_key}:`)}`,
          Authorization: `Basic ${btoa(`${unlayer_api_key}:`)}`,
        },
        body: JSON.stringify({ displayMode, design }),
      }).then((response) => response.json());
      if (res?.success && res?.data) {
        return res?.data.url;
      } else {
        console.log('RES:', res);
      }
    } catch (error) {
      return {};
    }
  };

  const getTemplates = async () => {
    console.log('unlayer_api_key', unlayer_api_key);
    try {
      setIsLoadingTemplates(true);
      // if (!projectSetting?.unlayer_api_key) throw Error('Missing api key');
      const res = await fetch('https://api.unlayer.com/v2/templates', {
        method: 'GET',
        headers: {
          // Authorization: `Basic ${btoa(`${projectSetting.unlayer_api_key}:`)}`,
          Authorization: `Basic ${btoa(`${unlayer_api_key}:`)}`,
        },
      }).then((response) => response.json());

      if (res?.success && res?.data && res?.data?.length > 0) {
        const templateData = res.data;
        const aaaa = templateData.map((temp, ind) => {
          // const image = await getDesignImage(temp.design, temp.displayMode);
          return getDesignImage(temp.design, temp.displayMode);
        });
        const asdf = await Promise.allSettled(aaaa);
        asdf.map((img, ind) => {
          if (img.status === 'fulfilled') {
            templateData[ind].img = img.value;
          }
        });

        // const image = await getDesignImage(templateData[0].design, templateData[0].displayMode);
        // const allTemplates = await Promise.allSettled(
        //   templateData.map((x) => getTemplateHTML(x.id))
        // );
        // const allFulfilled = allTemplates
        //   .filter((x) => x?.status === 'fulfilled')
        //   .map((y) => y.value);
        // const finalTemplates = allFulfilled.map((x) => {
        //   const foundTemplate = templateData.find((y) => y.id === x.id);
        //   if (foundTemplate) {
        //     return { ...foundTemplate, ...x };
        //   }
        // });
        // setTemplates(finalTemplates);
        setTemplates(templateData);
        setIsLoadingTemplates(false);
      } else {
        setIsLoadingTemplates(false);
        setTemplates([]);
      }
    } catch (error) {
      console.error('Error:', error?.message || '');
      setIsLoadingTemplates(false);
    }
  };

  useEffect(() => {
    getTemplates();
  }, []);

  const saveDesign = () => {
    emailEditorRef.current.editor.saveDesign((design) => {
      console.log('saveDesign', design);
      setDesigns((prev) => [...prev, design]);
    });
  };

  const loadDesign = (design) => {
    emailEditorRef.current.editor.loadDesign(design);
  };

  // const LoadTemplateDesign = () => {
  //   // emailEditorRef.current.editor.loadDesign({
  //   //   html: '<html><body><div>This is a legacy HTML template.</div></body></html>',
  //   //   classic: true,
  //   // });
  //   emailEditorRef.current.editor.loadTemplate(123911);
  // };

  const loadTemplate = (templateId) => {
    emailEditorRef.current.editor.loadTemplate(templateId);
  };

  const previewHtml = () => {
    emailEditorRef.current.editor.exportHtml(
      (data) => {
        const { html } = data;
        // html = html.replace(
        //   /{{speaker_profile_picture}}/g,
        //   'https://cdn.v2dev.demohubilo.com/sessionbanner/345141/4450_5022_351789001633418893.png'
        // );
        // html = html.replace(/{{speaker_name}}/g, 'New speaker');
        setHtmlEmailContent(html);
        setOpenSidePanel(!openSidePanel);
        // alert('Output HTML has been logged in your developer console.');
        // ReactDOM.render(html,document.getElementById("previewEmail"));
        // return html
      },
      {
        mergeTags: {
          first_name: 'John',
          last_name: 'Doe',
        },
      }
    );
  };

  // const addNewBlock = () => {
  //   console.log('Add New Block Triggered');

  //   emailEditorRef.current.editor.registerTool({
  //     name: 'menu_tool',
  //     label: 'My Menu',
  //     icon: 'fa-bars',
  //     supportedDisplayModes: ['web', 'email'],
  //     options: {
  //       default: {
  //         title: null,
  //       },
  //       menu: {
  //         title: 'Menu Items',
  //         position: 1,
  //         options: {
  //           menu: {
  //             label: 'Menu Items',
  //             defaultValue: {
  //               items: [],
  //             },
  //             widget: 'menu_editor', // Custom Property Editor
  //           },
  //         },
  //       },
  //     },
  //     values: {},
  //     renderer: {
  //       Viewer: emailEditorRef.current.editor.createViewer({
  //         render(values) {
  //           // If the user has added no items yet, show empty placeholder template
  //           if (values.menu.items.length == 0) return false();
  //           return `
  //             <div class="menu">
  //                 <a href="#" target="_blank"> MENU 1</a>
  //             </div>
  //             `;
  //         },
  //       }),
  //       exporters: {
  //         web: function (values) {
  //           return `
  //           <div class="menu">
  //               <a href="#" target="_blank"> MENU 1</a>
  //           </div>
  //           `;
  //         },
  //         email: function (values) {
  //           return `
  //           <div class="menu">
  //               <a href="#" target="_blank"> MENU 1</a>
  //           </div>
  //           `;
  //         },
  //       },
  //       head: {
  //         css: function (values) {},
  //         js: function (values) {},
  //       },
  //     },
  //   });
  // };

  const addMergeTags = () => {
    console.log('Merge Tags Triggered');
    emailEditorRef.current.editor.setMergeTags({
      first_name: {
        name: 'First Name',
        value: '{{first_name}}',
        sample: 'John',
      },
      last_name: {
        name: 'Last Name',
        value: '{{last_name}}',
        sample: 'Doe',
      },
    });
  };

  const sendEmail = () => {
    const [header] = API.generateHeader(reduxData, null, null);

    emailEditorRef.current.editor.exportHtml(async (data) => {
      const { html } = data;
      const res = await sendMailPostCall({
        url: 'email/send/sendgrid',
        headers: {},
        body: {
          to: emails,
          subject: compaignName,
          template: html,
          meta: {
            eventid: reduxData.eventId,
            organiserid: reduxData.organiserId,
            tooltype: 'speaker',
            toolSearchKeyword: 'speakerId=',
            authorization: header.Authorization,
          },
        },
      });
      if (res.message === 'Email Sent') setMailSent(true);
    });
  };

  const onLoad = () => {};

  const onReady = () => {
    // editor is ready
    // registerProprtyEdi();
    console.log('onReady Trigger');
  };

  // export functions
  const exportObject = () => {
    emailEditorRef.current.editor.saveDesign((design) => {
      console.log('saveDesign', design);
    });
  };
  const exportHtml = () => {
    emailEditorRef.current.editor.exportHtml(
      (data) => {
        const { html } = data;
        console.log('exportHtml', html);
      }
      // { mergeTags: { first_name: 'John', last_name: 'Doe' } }
    );
  };
  const exportPlainText = () => {
    emailEditorRef.current.editor.exportPlainText((data) => {
      console.log('Text:', data.text);
    });
  };
  // const exportImage = () => {
  //   emailEditorRef.current.editor.exportImage((data) => {
  //     const { url } = data;
  //     console.log('URL:', url);
  //   });
  // };
  // const exportPDF = () => {
  //   emailEditorRef.current.editor.exportPdf((data) => {
  //     const { url } = data;
  //     console.log('PDF:', url);
  //   });
  // };
  // const exportZIP = () => {
  //   emailEditorRef.current.editor.exportZip((data) => {
  //     const { url } = data;
  //     console.log('Zip:', url);
  //   });
  // };
  const eventCommunityVersion = useCommunityVersionNumber();

  const APICALL = React.useCallback(
    (ACTION, reduxdata, methodType, URL, headerData, bodyData, APICB) => {
      const [header, body] = API.generateHeader(reduxdata, headerData, bodyData);

      let APIPromise;
      if (methodType === 'GET') {
        APIPromise = GETAPI(false, URL, source.AS, header);
      } else if (methodType === 'POST') {
        APIPromise = POSTAPI(false, URL, source.AS, header, body);
      } else if (methodType === 'PUT') {
        APIPromise = PUTAPI(false, URL, source.AS, header, body);
      } else if (methodType === 'POSTWITHCUSTOMDOMAIN') {
        APIPromise = POSTAPIWITHCUSTOMDOMAIN(false, URL, source.AS, header, body, CUSTOM_URL);
      }

      APIPromise.then((resp) => {
        if (resp.data.status === API.apiSuccessStatus) {
          if (resp.data.message)
            dispatch(setNewMessage({ message: resp.data.message, type: 'success', show: true }));
          if (APICB) APICB(ACTION, 'SUCCESS', resp.data, headerData);
        } else {
          API.errStatusHandler(resp, history, dispatch, () => {
            if (APICB) APICB(ACTION, 'ERROR', resp.data);
          });
        }
      }).catch(API.catchHandler);
    },
    []
  );

  const APICB = async (ACTION, type, data, headerData) => {
    switch (ACTION) {
      case 'GET_BRAND_EVENT_SETTING': {
        if (type === 'SUCCESS') {
          // setClearFields(false);
          console.log('GET_BRAND_EVENT_SETTING', data);
          setState({ ...state, logos: data.data.logos });
        }
        break;
      }
      default:
        break;
    }
  };

  useEffect(() => {
    // setLoadState({ ...loadingState, initialLoading: true });
    APICALL(
      'GET_BRAND_EVENT_SETTING',
      reduxData,
      'GET',
      GET_BRAND_EVENT_SETTING,
      {
        community_version: eventCommunityVersion,
      },
      null,
      APICB
    );
  }, []);
  const logo_images = [
    {
      id: 1,
      img: 'https://picsum.photos/200/300',
    },
    {
      id: 2,
      img: 'https://picsum.photos/200/300',
    },
  ];
  const products = state.logos.map((image) => {
    console.log('state', getEventLogo(EventData.organiser_id, image.img_file_name));
    if (image.img_file_name) {
      return {
        ...state.logos,
        // img: image.img,
        img: getEventLogo(EventData.organiser_id, image.img_file_name),
        id: image.id,
      };
    } else return { ...state.logos };
  });

  // `unlayer.registerTool({
  //                 name: 'speaker-profile',
  //                 label: 'Speaker Profile ',
  //                 icon: 'fa-user-circle',
  //                 supportedDisplayModes: ['web', 'email'],
  //                 options: {},
  //                 values: {},
  //                 renderer: {
  //                   Viewer: unlayer.createViewer({
  //                     render(values) {
  //                       return '<div><img src="https://cdn.v2dev.demohubilo.com/sessionbanner/345141/4450_5022_351789001633418893.png" alt="speaker profile" height="100%" width="100%" />{{speaker_name}}</div>';
  //                     },
  //                   }),
  //                   exporters: {
  //                     web: function (values) {
  //                       return '<div><img src="{{speaker_profile_picture}}" alt="speaker profile" height="50%" width="50%" />{{speaker_name}}</div>';
  //                     },
  //                     email: function (values) {
  //                       return '<div><img src="{{speaker_profile_picture}}" alt="speaker profile" height="50%" width="50%" />{{speaker_name}}</div>';
  //                     },
  //                   },
  //                   head: {
  //                     css: function (values) {},
  //                     js: function (values) {},
  //                   },
  //                 },
  //               });
  //               `,
  console.log('doc : ', document.getElementById('customtool'));
  return (
    <>
      <Box>
        <Box
          mb={4}
          color="text.grayColor"
          display="flex"
          alignItems="center"
          justifyContent="space-between">
          <Box>
            <EmailEditor
              ref={emailEditorRef}
              editorId="editor"
              projectId={71154}
              id="editor-container"
              onLoad={onLoad}
              onReady={onReady}
              options={{
                customCSS: [
                  'https://examples.unlayer.com/examples/product-library-tool/productTool.css',
                ],
                customJS: [
                  'https://cdn.jsdelivr.net/gh/tanvi-hubilo/custom-tool@118869ad5c2acf1eee761b0629268501d8c0d0cd/custom-product.js',
                ],
                tools: {
                  'custom#logo_tool': {
                    data: {
                      products,
                    },
                    properties: {
                      logoLibrary: {
                        editor: {
                          data: {
                            products,
                          },
                        },
                      },
                    },
                  },
                },
              }}
            />
          </Box>
        </Box>

        <Box display="flex">
          <Button
            className={classes.buttonStyle}
            variant="text"
            color="primary"
            size="small"
            onClick={saveDesign}>
            Save design
          </Button>
          <Button
            className={classes.buttonStyle}
            variant="text"
            color="primary"
            size="small"
            onClick={previewHtml}>
            Preview HTML
          </Button>
          {/* <Button variant="contained" color="primary" size="small" onClick={addNewBlock}>
            Add New Block
          </Button> */}
          <Button
            className={classes.buttonStyle}
            variant="text"
            color="primary"
            size="small"
            onClick={addMergeTags}>
            Inject Merge Tags
          </Button>
          <Button
            className={classes.buttonStyle}
            variant="contained"
            color="primary"
            size="large"
            onClick={sendEmail}>
            SEND EMAIL
          </Button>
        </Box>
      </Box>

      <h3>Export</h3>
      <Box display="flex">
        <Button
          className={classes.buttonStyle}
          variant="text"
          color="primary"
          size="small"
          onClick={exportObject}>
          Export Object
        </Button>
        <Button
          className={classes.buttonStyle}
          variant="text"
          color="primary"
          size="small"
          onClick={exportHtml}>
          Export HTML
        </Button>
        <Button
          className={classes.buttonStyle}
          variant="text"
          color="primary"
          size="small"
          onClick={exportPlainText}>
          Export Plain Text
        </Button>
        {/* <Button variant="contained" color="primary" size="small" onClick={exportImage}>
          Export Image
        </Button>
        <Button variant="contained" color="primary" size="small" onClick={exportPDF}>
          Export PDF
        </Button>
        <Button variant="contained" color="primary" size="small" onClick={exportZIP}>
          Export ZIP
        </Button> */}
      </Box>

      <h3>Templates</h3>
      <Box display="flex">
        {isLoadingTemplates ? (
          <Typography variant="p" component="p">
            Loading templates please wait...
          </Typography>
        ) : templates && templates?.length > 0 ? (
          templates.map((template) => {
            return (
              <Box onClick={() => loadTemplate(template.id)}>
                <img src={template.img} alt="template" />
              </Box>
            );
          })
        ) : (
          <Typography variant="h5" component="h3">
            No templates found
          </Typography>
        )}
      </Box>

      <h3>Designs</h3>
      <Box display="flex">
        {designs && designs?.length > 0 ? (
          designs.map((design, i) => {
            return (
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={() => loadDesign(design)}>
                {i}
              </Button>
            );
          })
        ) : (
          <Typography variant="h6" component="h6">
            No designs added
          </Typography>
        )}
      </Box>

      <CustomModal isOpen={isMailSent} onClose={() => setMailSent(false)} paddingZero>
        <Box textAlign="center" maxWidth={580} ml="auto" mr="auto">
          <Box p={2}>
            <Typography variant="h5" component="h3">
              Mail Sent successfully..!
            </Typography>
          </Box>
        </Box>
      </CustomModal>

      <Sidebar
        open={openSidePanel}
        asideWidth={600}
        onClose={() => {
          setOpenSidePanel(false);
        }}
        title="Email Preview"
        footerCloseBtnLabel="Close">
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Box className="previewBlock">
              <div dangerouslySetInnerHTML={{ __html: HtmlEmailContent }} />
            </Box>
          </Grid>
        </Grid>
      </Sidebar>
    </>
  );
};

const CreateEmail = ({ setSpeakers, compaignName, setCompaignName, emails, setEmails }) => {
  const history = useHistory();
  const reduxData = useSelector(commonSelector, shallowEqual);
  const source = useSource();
  const dispatch = useDispatch();
  // const initialState = {
  //   email_from: '',
  //   email_sender_name: '',
  //   email_cc: [],
  //   email_bcc: [],
  // };
  // const [compaignName, setCompaignName] = useState('');
  const [eventType, setEventType] = useState('');
  // const [emails, setEmails] = useState([]);
  // const [formFields, setFormFields] = useState({ ...initialState });
  // const [tempFormFields, setTempFormFields] = useState({ ...initialState });

  const APICALL = React.useCallback(
    (ACTION, reduxData, methodType, URL, headerData, bodyData, APICB) => {
      const [header, body] = API.generateHeader(reduxData, headerData, bodyData);

      let APIPromise;
      if (methodType === 'GET') {
        APIPromise = GETAPI(false, URL, source.AS, header);
      } else if (methodType === 'POST') {
        APIPromise = POSTAPI(false, URL, source.AS, header, body);
      } else if (methodType === 'PUT') {
        APIPromise = PUTAPI(false, URL, source.AS, header, body);
      } else if (methodType === 'POSTWITHCUSTOMDOMAIN') {
        APIPromise = POSTAPIWITHCUSTOMDOMAIN(false, URL, source.AS, header, body, CUSTOM_URL);
      }

      APIPromise.then((resp) => {
        if (resp.data.status === API.apiSuccessStatus) {
          if (resp.data.message)
            dispatch(setNewMessage({ message: resp.data.message, type: 'success', show: true }));
          if (APICB) APICB(ACTION, 'SUCCESS', resp.data, headerData);
        } else {
          API.errStatusHandler(resp, history, dispatch, () => {
            if (APICB) APICB(ACTION, 'ERROR', resp.data);
          });
        }
      }).catch(API.catchHandler);
    },
    []
  );

  const APICB = async (ACTION, type, data, headerData) => {
    switch (ACTION) {
      case 'GET-SPEAKER-LIST': {
        if (type === 'SUCCESS') {
          setSpeakers(data.data);
        }
        break;
      }
      default:
        break;
    }
  };

  return (
    <>
      <Box>
        {/* Email To, From screen will be here.  */}
        <InputField
          // error={error}
          label="Compaign name"
          placeholder="Enter Compaign Name"
          type="text"
          value={compaignName}
          onChange={(e) => setCompaignName(e.target.value)}
        />
        <br />
        <br />

        <EditableOption
          label="Enter Emails"
          // helperText="Enter email id and press enter"
          name="email_List"
          placeholder="Enter email id and press enter"
          // error={errObj.email_cc}
          value={emails}
          onEnter={(val, name, clearCB) => {
            if (!emailRegex.test(val)) {
              // console.error('please enter a valid email');
            } else {
              setEmails((prev) => [...prev, val]);
              if (clearCB) clearCB();
            }
          }}
          onDeleteValue={(val) => {
            const indexToRemove = emails.findIndex((ele) => ele === val);
            setEmails((prev) => prev.filter((x, i) => i !== indexToRemove));
          }}
        />

        <p>Select template type</p>
        <BtnGroup
          size="medium"
          variant="outlined"
          isFluidBtn
          name="eventTypeId"
          value={eventType}
          options={[
            {
              label: 'Speaker',
              isChecked: eventType === 'Speaker',
              type: 'Speaker',
            },
            {
              label: 'People',
              isChecked: eventType === 'People',
              type: 'People',
            },
            {
              label: 'Event',
              isChecked: eventType === 'Event',
              type: 'Event',
            },
          ]}
          onChange={(checkbox) => {
            setEventType(checkbox.type);
            if (checkbox.type === 'Speaker')
              APICALL(
                'GET-SPEAKER-LIST',
                reduxData,
                'POSTWITHCUSTOMDOMAIN',
                GET_SPEAKER_LIST,
                null,
                null,
                APICB,
                true
              );
          }}
        />
      </Box>
    </>
  );
};

const EmailReport = () => {
  const classes = useStyles();

  return (
    <>
      <Box mb={3}>
        <Card>
          <CardContent className={classes.sessionCardContent}>
            <Grid container spacing={2} justifyContent="space-between">
              <Grid item md={12} sm={12} xs={12}>
                <Typography variant="h5" component="h5">
                  {' '}
                  12 Recipients{' '}
                </Typography>
                <Box mt={1} display="flex" alignItems="center">
                  {' '}
                  <Typography variant="subtitle2" component="span">
                    {' '}
                    Sent To:{' '}
                  </Typography>{' '}
                  <Typography variant="body2" component="span">
                    {' '}
                    john@gmail.com, dk@gmail.com, pop@gmail.com, denial@gmail.com...
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
      <Box mb={3}>
        <Card>
          <CardContent className={classes.sessionCardContent}>
            <Grid container spacing={2} justifyContent="space-between">
              <Grid item md={2} sm={4} xs={6}>
                <Typography variant="caption" component="h3" className={classes.boldText}>
                  <SvgMail className={classes.emailIcon} height="1rem" width="1rem" /> SENT
                </Typography>
                <Typography variant="h4" component="span" className={classes.subTitle}>
                  12
                </Typography>
              </Grid>

              <Grid item md={2} sm={4} xs={6}>
                <Typography variant="caption" component="h3" className={classes.boldText}>
                  <SvgMail className={classes.emailIcon} height="1rem" width="1rem" /> DELIVERED
                </Typography>
                <Typography variant="h4" component="span" className={classes.subTitle}>
                  10
                </Typography>
              </Grid>

              <Grid item md={2} sm={4} xs={6}>
                <Typography variant="caption" component="h3" className={classes.boldText}>
                  <SvgMail className={classes.emailIcon} height="1rem" width="1rem" /> OPENED
                </Typography>
                <Typography variant="h4" component="span" className={classes.subTitle}>
                  10
                </Typography>
              </Grid>

              <Grid item md={2} sm={4} xs={6}>
                <Typography variant="caption" component="h3" className={classes.boldText}>
                  <SvgMail className={classes.emailIcon} height="1rem" width="1rem" /> CLICKED
                </Typography>
                <Typography variant="h4" component="span" className={classes.subTitle}>
                  9
                </Typography>
              </Grid>

              <Grid item md={2} sm={4} xs={6}>
                <Typography variant="caption" component="h3" className={classes.boldText}>
                  <SvgMail className={classes.emailIcon} height="1rem" width="1rem" /> BOUNCED
                </Typography>
                <Typography variant="h4" component="span" className={classes.subTitle}>
                  0
                </Typography>
              </Grid>

              <Grid item md={2} sm={4} xs={6}>
                <Typography variant="caption" component="h3" className={classes.boldText}>
                  <SvgMail className={classes.emailIcon} height="1rem" width="1rem" /> SPAM
                </Typography>
                <Typography variant="h4" component="span" className={classes.subTitle}>
                  2
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </>
  );
};

export default function EmailBuilder() {
  const classes = useStyles();
  // const [isShow, setShow] = React.useState(false);
  const [selectedTabType, setSelectedTabType] = useState('createCompaign');
  const [speakers, setSpeakers] = useState([]);
  const [compaignName, setCompaignName] = useState('');
  const [emails, setEmails] = useState([]);

  const handleChange = (event, newValue) => {
    setSelectedTabType(newValue);
  };

  return (
    <>
      <Box>
        <Container maxWidth="lg">
          <Box
            mb={4}
            color="text.grayColor"
            display="flex"
            alignItems="center"
            justifyContent="space-between">
            <Box>
              <Tabs
                value={selectedTabType}
                onChange={handleChange}
                indicatorColor="primary"
                aria-label="Email Builder">
                <Tab
                  className={classes.tabBlock}
                  label="1. Create Compaign"
                  value="createCompaign"
                  {...a11yProps('CreateCompaign')}
                />
                <Tab
                  className={classes.tabBlock}
                  label="2. Design Compaign"
                  value="designCompaign"
                  {...a11yProps('DesignCompaign')}
                />
                <Tab
                  className={classes.tabBlock}
                  label="3. Email Compaign Report"
                  value="emailCompaignReport"
                  {...a11yProps('EmailCompaignReport')}
                />
              </Tabs>
            </Box>
          </Box>
          <TabPanel value={selectedTabType} index="createCompaign">
            <CreateEmail
              setSpeakers={setSpeakers}
              compaignName={compaignName}
              setCompaignName={setCompaignName}
              emails={emails}
              setEmails={setEmails}
            />
          </TabPanel>
          <TabPanel value={selectedTabType} index="designCompaign">
            <DesignEmail speakers={speakers} emails={emails} compaignName={compaignName} />
          </TabPanel>
          <TabPanel value={selectedTabType} index="emailCompaignReport">
            <EmailReport />
          </TabPanel>
        </Container>
      </Box>
    </>
  );
}
